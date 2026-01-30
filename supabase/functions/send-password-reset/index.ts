import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PasswordResetRequest {
  email: string;
  redirectUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, redirectUrl }: PasswordResetRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email é obrigatório" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 🔒 Redirecionar para página dedicada de redefinição de senha
    const baseUrl = redirectUrl ? new URL(redirectUrl).origin : '';
    const finalRedirectUrl = `${baseUrl}/redefinir-senha`;
    console.log('🔑 RedirectUrl para página dedicada:', finalRedirectUrl);

    // Usar service role para gerar link de reset
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Gerar link de recuperação de senha
    const { data, error: resetError } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email: email,
      options: {
        redirectTo: finalRedirectUrl,
      },
    });

    if (resetError) {
      console.error("Erro ao gerar link de reset:", resetError);
      return new Response(
        JSON.stringify({ error: resetError.message }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const resetLink = data?.properties?.action_link;

    if (!resetLink) {
      return new Response(
        JSON.stringify({ error: "Não foi possível gerar o link de redefinição" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Enviar email em português usando Resend
    const emailResponse = await resend.emails.send({
      from: "Anúncios Que Vende <noreply@grupodecore.com.br>",
      to: [email],
      subject: "Redefinir sua senha - Anúncios Que Vende",
      html: `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f7;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f7; padding: 40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); padding: 30px; text-align: center;">
                      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold;">Anúncios Que Vende</h1>
                      <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Analytics e Gestão</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <h2 style="margin: 0 0 20px 0; color: #1f2937; font-size: 24px; font-weight: 600;">Redefinir sua senha</h2>
                      
                      <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Olá! Recebemos uma solicitação para redefinir a senha da sua conta no Anúncios Que Vende.
                      </p>
                      
                      <p style="margin: 0 0 30px 0; color: #4b5563; font-size: 16px; line-height: 1.6;">
                        Clique no botão abaixo para criar uma nova senha. Este link é válido por 24 horas.
                      </p>
                      
                      <!-- Button -->
                      <table width="100%" cellpadding="0" cellspacing="0">
                        <tr>
                          <td align="center">
                            <a href="${resetLink}" 
                               style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);">
                              Redefinir Minha Senha
                            </a>
                          </td>
                        </tr>
                      </table>
                      
                      <p style="margin: 30px 0 0 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                        Se você não solicitou a redefinição de senha, pode ignorar este email com segurança. Sua senha permanecerá inalterada.
                      </p>
                      
                      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                      
                      <p style="margin: 0; color: #9ca3af; font-size: 12px; line-height: 1.6;">
                        Se o botão não funcionar, copie e cole este link no seu navegador:<br>
                        <a href="${resetLink}" style="color: #4f46e5; word-break: break-all;">${resetLink}</a>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center;">
                      <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                        © ${new Date().getFullYear()} Anúncios Que Vende. Todos os direitos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Email de reset enviado:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, message: "Email enviado com sucesso" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Erro na função send-password-reset:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
