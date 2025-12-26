import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get authorization header to verify admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authorization header required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create client with user's token to verify permissions
    const supabaseClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user: currentUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !currentUser) {
      return new Response(
        JSON.stringify({ error: "Invalid user session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if current user is admin
    const { data: adminRole } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "Only administrators can delete users" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { userId } = await req.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent self-deletion
    if (userId === currentUser.id) {
      return new Response(
        JSON.stringify({ error: "Cannot delete your own account" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Attempting to delete user: ${userId}`);

    // First, delete related records that might block the deletion
    // Delete user roles
    const { error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .delete()
      .eq("user_id", userId);
    
    if (rolesError) {
      console.log("Error deleting user roles:", rolesError.message);
    }

    // Delete from alunos if exists
    const { error: alunosError } = await supabaseAdmin
      .from("alunos")
      .delete()
      .eq("user_id", userId);
    
    if (alunosError) {
      console.log("Error deleting alunos:", alunosError.message);
    }

    // Delete from professores if exists
    const { error: professoresError } = await supabaseAdmin
      .from("professores")
      .delete()
      .eq("user_id", userId);
    
    if (professoresError) {
      console.log("Error deleting professores:", professoresError.message);
    }

    // Delete from funcionarios if exists
    const { error: funcionariosError } = await supabaseAdmin
      .from("funcionarios")
      .delete()
      .eq("user_id", userId);
    
    if (funcionariosError) {
      console.log("Error deleting funcionarios:", funcionariosError.message);
    }

    // Delete notifications for this user
    const { error: notificacoesError } = await supabaseAdmin
      .from("notificacoes")
      .delete()
      .eq("user_id", userId);
    
    if (notificacoesError) {
      console.log("Error deleting notificacoes:", notificacoesError.message);
    }

    // Delete profile (this should cascade or set null for other references)
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", userId);
    
    if (profileError) {
      console.log("Error deleting profile:", profileError.message);
      // Continue anyway, as deleting the auth user will handle cleanup
    }

    // Delete user from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.log("Error deleting auth user:", deleteError.message);
      return new Response(
        JSON.stringify({ error: `Erro ao eliminar utilizador: ${deleteError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${userId} deleted successfully`);

    return new Response(
      JSON.stringify({ success: true, message: "User deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Delete user error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
