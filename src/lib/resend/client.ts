/**
 * Resend Client
 * @description Cliente para envio de emails via Resend
 */

// Configurações
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@seudominio.com';

if (!RESEND_API_KEY && process.env.NODE_ENV === 'development') {
  console.warn('RESEND_API_KEY not configured. Emails will not be sent.');
}

// Tipo para o cliente Resend (para evitar dependência direta)
type ResendClient = {
  emails: {
    send: (params: { from: string; to: string; subject: string; html: string }) => Promise<{ id?: string }>;
  };
  domains: {
    list: () => Promise<unknown>;
  };
};

// Cliente Resend inicializado sob demanda
let _resendClient: ResendClient | null = null;

async function getResendClient(): Promise<ResendClient | null> {
  if (!RESEND_API_KEY) {
    return null;
  }

  if (!_resendClient) {
    try {
      const { Resend } = await import('resend');
      _resendClient = new Resend(RESEND_API_KEY) as ResendClient;
    } catch {
      console.error('Failed to load resend package. Email sending disabled.');
      return null;
    }
  }

  return _resendClient;
}

// Export para retrocompatibilidade
export const resend = {
  emails: {
    send: async (params: { from: string; to: string; subject: string; html: string }) => {
      const client = await getResendClient();
      if (!client) {
        throw new Error('Resend client not available');
      }
      return client.emails.send(params);
    }
  },
  domains: {
    list: async () => {
      const client = await getResendClient();
      if (!client) {
        throw new Error('Resend client not available');
      }
      return client.domains.list();
    }
  }
};

// Imports dinâmicos para evitar problemas de build se libs não estiverem presentes
// Mas como instalamos, podemos importar. Porém, manter compatibilidade.
import { render } from '@react-email/render';
import WelcomeEmail from '@/lib/email/templates/WelcomeEmail';

// Tipos de email
export type EmailTemplate =
  | 'welcome'
  | 'payment-confirmed'
  | 'payment-late'
  | 'account-blocked'
  | 'account-unblocked'
  | 'plan-upgraded'
  | 'plan-downgraded'
  | 'subscription-canceled'
  | 'password-reset'
  | 'email-verification';

// Interface para dados de email
export interface EmailData {
  to: string;
  template: EmailTemplate;
  data: Record<string, any>;
  userId?: string;
}

// Interface para resultado de envio
export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Enviar email usando Resend
 */
export async function sendEmail(
  emailData: EmailData
): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    console.error('Cannot send email: RESEND_API_KEY not configured');
    return {
      success: false,
      error: 'Email service not configured',
    };
  }

  try {
    // Obter template e assunto
    const { subject, html } = await getEmailTemplate(
      emailData.template,
      emailData.data
    );

    // Enviar email
    const response = await resend.emails.send({
      from: FROM_EMAIL,
      to: emailData.to,
      subject,
      html,
    });

    // Log de sucesso (será salvo no banco de dados)
    await logEmail({
      userId: emailData.userId,
      template: emailData.template,
      recipient: emailData.to,
      subject,
      status: 'sent',
      providerId: response.id,
    });

    return {
      success: true,
      messageId: response.id,
    };
  } catch (error) {
    console.error('Error sending email:', error);

    // Log de erro
    await logEmail({
      userId: emailData.userId,
      template: emailData.template,
      recipient: emailData.to,
      subject: 'Failed to send',
      status: 'failed',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Obter template de email
 */
async function getEmailTemplate(
  template: EmailTemplate,
  data: Record<string, any>
): Promise<{ subject: string; html: string }> {
  switch (template) {
    case 'welcome':
      return {
        subject: `Bem-vindo ao ${data.appName || 'nosso SaaS'}!`,
        html: await render(WelcomeEmail({
          name: data.name,
          appName: data.appName,
          dashboardUrl: data.dashboardUrl,
        })),
      };

    case 'payment-confirmed':
      return {
        subject: 'Pagamento confirmado com sucesso',
        html: getPaymentConfirmedTemplate(data),
      };

    case 'payment-late':
      return {
        subject: '⚠️ Ação necessária: Pagamento em atraso',
        html: getPaymentLateTemplate(data),
      };

    case 'account-blocked':
      return {
        subject: '🔒 Sua conta foi bloqueada',
        html: getAccountBlockedTemplate(data),
      };

    case 'account-unblocked':
      return {
        subject: '✅ Conta reativada com sucesso!',
        html: getAccountUnblockedTemplate(data),
      };

    case 'plan-upgraded':
      return {
        subject: '🎉 Parabéns pelo upgrade!',
        html: getPlanUpgradedTemplate(data),
      };

    case 'plan-downgraded':
      return {
        subject: 'Seu plano foi alterado',
        html: getPlanDowngradedTemplate(data),
      };

    case 'subscription-canceled':
      return {
        subject: 'Assinatura cancelada',
        html: getSubscriptionCanceledTemplate(data),
      };

    case 'password-reset':
      return {
        subject: 'Redefinir sua senha',
        html: getPasswordResetTemplate(data),
      };

    case 'email-verification':
      return {
        subject: 'Verifique seu email',
        html: getEmailVerificationTemplate(data),
      };

    default:
      throw new Error(`Unknown email template: ${template}`);
  }
}

/**
 * Log de email no banco de dados
 */
async function logEmail(params: {
  userId?: string;
  template: string;
  recipient: string;
  subject: string;
  status: 'sent' | 'failed';
  providerId?: string;
  errorMessage?: string;
}) {
  // Importação dinâmica para evitar circular dependency
  const { createClient } = await import('@supabase/supabase-js');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Cannot log email: Supabase not configured');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    await supabase.from('email_logs').insert({
      user_id: params.userId || null,
      template: params.template,
      recipient: params.recipient,
      subject: params.subject,
      status: params.status,
      provider_id: params.providerId || null,
      error_message: params.errorMessage || null,
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log email:', error);
  }
}

/**
 * Verificar conexão com Resend
 */
export async function checkResendConnection(): Promise<boolean> {
  if (!RESEND_API_KEY) {
    return false;
  }

  try {
    // Tentar fazer uma requisição simples à API
    await resend.domains.list();
    return true;
  } catch {
    return false;
  }
}

// =====================================================
// TEMPLATES HTML
// =====================================================

function getWelcomeTemplate(data: Record<string, any>): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">Bem-vindo!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Olá <strong>${data.name || 'usuário'}</strong>,</p>

    <p>É um prazer ter você conosco! Sua conta foi criada com sucesso e você já pode começar a usar o <strong>${data.appName || 'nosso serviço'}</strong>.</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea;">
      <h3 style="margin-top: 0; color: #667eea;">Detalhes da sua assinatura:</h3>
      <p style="margin: 5px 0;"><strong>Plano:</strong> ${data.planName || 'Plano Básico'}</p>
      <p style="margin: 5px 0;"><strong>Período:</strong> ${data.billingCycle === 'yearly' ? 'Anual' : 'Mensal'}</p>
      ${data.trialEndsAt ? `<p style="margin: 5px 0;"><strong>Teste grátis até:</strong> ${new Date(data.trialEndsAt).toLocaleDateString('pt-BR')}</p>` : ''}
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.dashboardUrl || '#'}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Acessar Dashboard</a>
    </div>

    <p style="font-size: 14px; color: #666; margin-top: 30px;">
      Se tiver alguma dúvida, estamos aqui para ajudar!<br>
      Entre em contato: ${data.supportEmail || 'suporte@seudominio.com'}
    </p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #999;">
    <p>© ${new Date().getFullYear()} ${data.appName || 'SaaS'}. Todos os direitos reservados.</p>
  </div>
</body>
</html>
  `;
}

function getPaymentConfirmedTemplate(data: Record<string, any>): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #10B981; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">✅ Pagamento Confirmado</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Olá <strong>${data.name || 'usuário'}</strong>,</p>

    <p>Recebemos seu pagamento com sucesso!</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3 style="margin-top: 0; color: #10B981;">Detalhes do pagamento:</h3>
      <p style="margin: 5px 0;"><strong>Valor:</strong> R$ ${data.amount?.toFixed(2) || '0,00'}</p>
      <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date(data.paidAt || Date.now()).toLocaleDateString('pt-BR')}</p>
      <p style="margin: 5px 0;"><strong>Próximo vencimento:</strong> ${new Date(data.nextPaymentAt || Date.now()).toLocaleDateString('pt-BR')}</p>
    </div>

    ${data.invoiceUrl ? `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.invoiceUrl}" style="background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Ver Recibo</a>
    </div>
    ` : ''}
  </div>
</body>
</html>
  `;
}

function getPaymentLateTemplate(data: Record<string, any>): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #EF4444; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">⚠️ Pagamento em Atraso</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Olá <strong>${data.name || 'usuário'}</strong>,</p>

    <p>Identificamos que seu pagamento está em atraso há <strong>${data.daysLate || 0} dias</strong>.</p>

    <div style="background: #FEE2E2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #EF4444;">
      <p style="margin: 5px 0;"><strong>Valor devido:</strong> R$ ${data.amountDue?.toFixed(2) || '0,00'}</p>
      <p style="margin: 5px 0;"><strong>Vencimento:</strong> ${new Date(data.dueDate || Date.now()).toLocaleDateString('pt-BR')}</p>
    </div>

    <p>Para evitar a interrupção do serviço, atualize seu método de pagamento o quanto antes.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.updatePaymentUrl || '#'}" style="background: #EF4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Atualizar Pagamento</a>
    </div>
  </div>
</body>
</html>
  `;
}

function getAccountBlockedTemplate(data: Record<string, any>): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #DC2626; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🔒 Conta Bloqueada</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Olá <strong>${data.name || 'usuário'}</strong>,</p>

    <p>Sua conta foi bloqueada devido a: <strong>${data.reason === 'payment_overdue' ? 'Pagamento em atraso' : data.reason || 'Motivo não especificado'}</strong>.</p>

    <p>Para reativar seu acesso, é necessário regularizar seu pagamento.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.regularizeUrl || '#'}" style="background: #DC2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Regularizar Pagamento</a>
    </div>
  </div>
</body>
</html>
  `;
}

function getAccountUnblockedTemplate(data: Record<string, any>): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #10B981; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">✅ Conta Reativada!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Olá <strong>${data.name || 'usuário'}</strong>,</p>

    <p>Ótimas notícias! Sua conta foi reativada com sucesso.</p>

    <p>Você já pode acessar todos os recursos do seu plano <strong>${data.planName || 'atual'}</strong>.</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.dashboardUrl || '#'}" style="background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Acessar Dashboard</a>
    </div>
  </div>
</body>
</html>
  `;
}

function getPlanUpgradedTemplate(data: Record<string, any>): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">🎉 Parabéns pelo Upgrade!</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Olá <strong>${data.name || 'usuário'}</strong>,</p>

    <p>Seu plano foi atualizado com sucesso!</p>

    <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Plano anterior:</strong> ${data.oldPlanName || '-'}</p>
      <p style="margin: 5px 0;"><strong>Novo plano:</strong> ${data.newPlanName || '-'}</p>
    </div>

    <p>Agora você tem acesso a novos recursos!</p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${data.dashboardUrl || '#'}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Explorar Recursos</a>
    </div>
  </div>
</body>
</html>
  `;
}

function getPlanDowngradedTemplate(data: Record<string, any>): string {
  return getPlainTemplate('Plano Alterado', `
    <p>Seu plano foi alterado:</p>
    <p><strong>De:</strong> ${data.oldPlanName || '-'}</p>
    <p><strong>Para:</strong> ${data.newPlanName || '-'}</p>
  `, data);
}

function getSubscriptionCanceledTemplate(data: Record<string, any>): string {
  return getPlainTemplate('Assinatura Cancelada', `
    <p>Sua assinatura foi cancelada.</p>
    <p>Você terá acesso até: <strong>${new Date(data.accessUntil || Date.now()).toLocaleDateString('pt-BR')}</strong></p>
    ${data.exportDataUrl ? `<p><a href="${data.exportDataUrl}">Exportar seus dados</a></p>` : ''}
  `, data);
}

function getPasswordResetTemplate(data: Record<string, any>): string {
  return getPlainTemplate('Redefinir Senha', `
    <p>Você solicitou a redefinição de senha.</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${data.resetUrl || '#'}" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Redefinir Senha</a>
    </p>
    <p style="font-size: 14px; color: #666;">Este link expira em 24 horas.</p>
  `, data);
}

function getEmailVerificationTemplate(data: Record<string, any>): string {
  return getPlainTemplate('Verificar Email', `
    <p>Por favor, confirme seu endereço de email.</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="${data.verifyUrl || '#'}" style="background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verificar Email</a>
    </p>
  `, data);
}

// Template simples reutilizável
function getPlainTemplate(title: string, content: string, data: Record<string, any>): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #667eea; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0;">${title}</h1>
  </div>

  <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
    <p style="font-size: 16px;">Olá <strong>${data.name || 'usuário'}</strong>,</p>
    ${content}
  </div>
</body>
</html>
  `;
}
