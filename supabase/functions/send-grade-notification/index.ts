import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rate limiting configuration
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window
const MAX_REQUESTS_PER_WINDOW = 50; // Max 50 requests per minute (for batch grade notifications)

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

interface GradeNotificationRequest {
  aluno_id: string;
  disciplina_id: string;
  trimestre: number;
  tipo: "nova" | "atualizada";
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get IP or use a fallback identifier for rate limiting
    // For database triggers, we use a global rate limit
    const clientIP = req.headers.get("x-forwarded-for") || 
                     req.headers.get("x-real-ip") || 
                     "database-trigger";
    
    // Apply rate limiting
    const rateLimitResult = checkRateLimit(`grade-notification:${clientIP}`);
    if (!rateLimitResult.allowed) {
      console.log(`Rate limit exceeded for ${clientIP}`);
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

    const { aluno_id, disciplina_id, trimestre, tipo }: GradeNotificationRequest = await req.json();

    console.log("Received grade notification request:", { aluno_id, disciplina_id, trimestre, tipo });

    // Create Supabase client with service role key for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get student info with email
    const { data: alunoData, error: alunoError } = await supabase
      .from("alunos")
      .select(`
        id,
        numero_matricula,
        user_id,
        profiles:user_id (
          nome_completo,
          email
        )
      `)
      .eq("id", aluno_id)
      .single();

    if (alunoError || !alunoData) {
      console.error("Error fetching student:", alunoError);
      return new Response(
        JSON.stringify({ error: "Student not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get discipline info
    const { data: disciplinaData, error: disciplinaError } = await supabase
      .from("disciplinas")
      .select("nome")
      .eq("id", disciplina_id)
      .single();

    if (disciplinaError || !disciplinaData) {
      console.error("Error fetching discipline:", disciplinaError);
      return new Response(
        JSON.stringify({ error: "Discipline not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const profileData = alunoData.profiles as unknown;
    const profile = profileData as { nome_completo: string; email: string | null } | null;
    const studentEmail = profile?.email;
    const studentName = profile?.nome_completo || "Aluno";
    const disciplineName = disciplinaData.nome;
    const trimestreText = `${trimestre}º Trimestre`;

    if (!studentEmail) {
      console.log("Student has no email configured, skipping email notification");
      return new Response(
        JSON.stringify({ message: "No email configured for student" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isNewGrade = tipo === "nova";
    const subject = isNewGrade 
      ? `Nova Nota Lançada - ${disciplineName}` 
      : `Nota Atualizada - ${disciplineName}`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f7fa;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); border-radius: 12px 12px 0 0; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🎓 Sistema de Gestão Escolar</h1>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <h2 style="color: #1e40af; margin-top: 0;">
              ${isNewGrade ? "📝 Nova Nota Lançada" : "✏️ Nota Atualizada"}
            </h2>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Olá <strong>${studentName}</strong>,
            </p>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              ${isNewGrade 
                ? `Uma nova nota foi lançada para a disciplina de <strong>${disciplineName}</strong> referente ao <strong>${trimestreText}</strong>.`
                : `A sua nota da disciplina de <strong>${disciplineName}</strong> referente ao <strong>${trimestreText}</strong> foi atualizada.`
              }
            </p>
            
            <div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
              <p style="margin: 0; color: #1e40af; font-weight: 600;">
                📚 Disciplina: ${disciplineName}
              </p>
              <p style="margin: 8px 0 0 0; color: #1e40af;">
                📅 Período: ${trimestreText}
              </p>
            </div>
            
            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
              Aceda ao portal do aluno para consultar os detalhes da sua avaliação.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="#" style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
                Ver Minhas Notas
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
            
            <p style="color: #6b7280; font-size: 14px; text-align: center; margin: 0;">
              Este é um email automático. Por favor, não responda a esta mensagem.
            </p>
          </div>
          
          <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">
            © ${new Date().getFullYear()} Sistema de Gestão Escolar
          </p>
        </div>
      </body>
      </html>
    `;

    console.log("Sending email to:", studentEmail);

    const emailResponse = await resend.emails.send({
      from: "Sistema Escolar <onboarding@resend.dev>",
      to: [studentEmail],
      subject: subject,
      html: htmlContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error in send-grade-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});