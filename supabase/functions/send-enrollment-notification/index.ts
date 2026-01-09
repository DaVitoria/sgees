import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 20; // Max 20 requests per minute per user

// In-memory rate limit store (resets on function cold start)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitStore.get(identifier);

  if (!record || now > record.resetTime) {
    // New window or expired - reset
    rateLimitStore.set(identifier, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_REQUESTS_PER_WINDOW) {
    const retryAfter = Math.ceil((record.resetTime - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment count
  record.count++;
  rateLimitStore.set(identifier, record);
  return { allowed: true };
}

// Clean up old entries periodically
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, value] of rateLimitStore.entries()) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

interface EnrollmentNotificationRequest {
  aluno_id: string;
  status: string;
  turma_id: string | null;
  observacoes: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-enrollment-notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication - require Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.log("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create client with the provided auth token to verify caller
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the JWT token and get claims
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.log("Invalid JWT token:", claimsError?.message);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub;
    console.log(`Authenticated user: ${userId}`);

    // Apply rate limiting based on user ID
    const rateLimitResult = checkRateLimit(`enrollment-notification:${userId}`);
    if (!rateLimitResult.allowed) {
      console.log(`Rate limit exceeded for user ${userId}`);
      return new Response(
        JSON.stringify({ 
          error: "Too many requests. Please try again later.",
          retryAfter: rateLimitResult.retryAfter 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitResult.retryAfter)
          } 
        }
      );
    }

    // Cleanup old rate limit entries periodically
    cleanupRateLimitStore();

    // Check if user has admin or secretario role
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: userRoles, error: rolesError } = await supabaseService
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    if (rolesError) {
      console.error("Error fetching user roles:", rolesError);
      return new Response(
        JSON.stringify({ error: "Failed to verify authorization" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const allowedRoles = ["admin", "secretario"];
    const hasPermission = userRoles?.some(r => allowedRoles.includes(r.role));

    if (!hasPermission) {
      console.log(`User ${userId} does not have required role. Roles: ${userRoles?.map(r => r.role).join(", ")}`);
      return new Response(
        JSON.stringify({ error: "Forbidden - Insufficient permissions" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`User ${userId} authorized with roles: ${userRoles?.map(r => r.role).join(", ")}`);

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.log("RESEND_API_KEY not configured, skipping email");
      return new Response(
        JSON.stringify({ message: "Email service not configured" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Use service role client for database operations
    const supabase = supabaseService;

    const { aluno_id, status, turma_id, observacoes }: EnrollmentNotificationRequest = await req.json();
    
    console.log(`Processing enrollment notification for aluno_id: ${aluno_id}, status: ${status}`);

    // Fetch student and profile data
    const { data: alunoData, error: alunoError } = await supabase
      .from("alunos")
      .select(`
        numero_matricula,
        profiles:user_id (
          nome_completo,
          email
        )
      `)
      .eq("id", aluno_id)
      .single();

    if (alunoError || !alunoData) {
      console.error("Error fetching aluno data:", alunoError);
      return new Response(
        JSON.stringify({ error: "Aluno não encontrado" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const profile = alunoData.profiles as any;
    const studentEmail = profile?.email;
    const studentName = profile?.nome_completo || "Aluno";

    if (!studentEmail) {
      console.log("Student has no email, skipping email notification");
      return new Response(
        JSON.stringify({ message: "No email to send notification to" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Fetch turma details if assigned
    let turmaInfo = "";
    if (turma_id) {
      const { data: turmaData } = await supabase
        .from("turmas")
        .select("nome, classe")
        .eq("id", turma_id)
        .single();

      if (turmaData) {
        turmaInfo = `${turmaData.classe}ª Classe - ${turmaData.nome}`;
      }
    }

    // Build email content
    const isApproved = status === "aprovada";
    const subject = isApproved 
      ? "Matrícula Aprovada - Sistema de Gestão Escolar" 
      : "Matrícula Rejeitada - Sistema de Gestão Escolar";

    const htmlContent = isApproved
      ? `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .success-badge { background: #dcfce7; color: #166534; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
            .turma-box { background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Parabéns!</h1>
              <p>A sua matrícula foi aprovada</p>
            </div>
            <div class="content">
              <p>Olá <strong>${studentName}</strong>,</p>
              <p>Temos o prazer de informar que a sua matrícula foi <span class="success-badge">✓ APROVADA</span></p>
              ${turmaInfo ? `
                <div class="turma-box">
                  <strong>🏫 Turma Atribuída:</strong><br>
                  ${turmaInfo}
                </div>
              ` : '<p>A turma será atribuída em breve pela secretaria.</p>'}
              <p>Pode acompanhar o estado da sua matrícula através do portal do aluno.</p>
              <p>Bem-vindo(a) à nossa comunidade escolar!</p>
            </div>
            <div class="footer">
              <p>Sistema de Gestão Escolar</p>
            </div>
          </div>
        </body>
        </html>
      `
      : `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .rejected-badge { background: #fee2e2; color: #991b1b; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
            .obs-box { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Informação sobre Matrícula</h1>
            </div>
            <div class="content">
              <p>Olá <strong>${studentName}</strong>,</p>
              <p>Lamentamos informar que a sua matrícula foi <span class="rejected-badge">✗ REJEITADA</span></p>
              ${observacoes ? `
                <div class="obs-box">
                  <strong>📝 Observação:</strong><br>
                  ${observacoes}
                </div>
              ` : ''}
              <p>Se tiver dúvidas, entre em contacto com a secretaria da escola para mais informações.</p>
            </div>
            <div class="footer">
              <p>Sistema de Gestão Escolar</p>
            </div>
          </div>
        </body>
        </html>
      `;

    // Send email using Resend API
    console.log(`Sending email to: ${studentEmail}`);
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Sistema Escolar <onboarding@resend.dev>",
        to: [studentEmail],
        subject: subject,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();
    console.log("Email response:", emailResult);

    if (!emailResponse.ok) {
      console.error("Email send failed:", emailResult);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailResult }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Email sent successfully");

    return new Response(
      JSON.stringify({ success: true, emailResponse: emailResult }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-enrollment-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);