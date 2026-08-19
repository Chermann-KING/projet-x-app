// Supabase Auth "Send Email" hook — remplace l'envoi d'email intégré de Supabase
// (anglais, non personnalisable par utilisateur) par un envoi via SMTP Gmail dans
// la langue de l'utilisateur (user_metadata.locale, capturée à l'inscription).
//
// SMTP Gmail plutôt qu'un service transactionnel (Resend, SendGrid...) : ces
// services exigent tous un domaine d'envoi vérifié avant d'autoriser l'envoi à
// de vrais destinataires (protection anti-spam standard du secteur) — projet-x
// n'a pas de domaine propre pour l'instant. Gmail n'a pas cette contrainte
// puisqu'on envoie depuis un compte Gmail déjà vérifié par Google. Gratuit,
// limite de 500 emails/jour largement suffisante pour un pilote.
//
// Ne gère pour l'instant que la réinitialisation de mot de passe (email_action_type
// === 'recovery'), seul flux concerné par le bug signalé. Les autres types
// (signup, magiclink, invite, email_change) échouent explicitement plutôt que
// d'échouer silencieusement à envoyer un email — à étendre si ces flux
// deviennent nécessaires.
//
// Config requise (secrets de la fonction, PAS de .env) :
//   supabase secrets set GMAIL_USER=xxx@gmail.com GMAIL_APP_PASSWORD=xxxx \
//     SEND_EMAIL_HOOK_SECRET=v1,whsec_xxx
// (GMAIL_APP_PASSWORD : mot de passe d'application généré sur
// myaccount.google.com/apppasswords, pas le mot de passe du compte)
// SUPABASE_URL est injecté automatiquement par la plateforme.

import { Webhook } from 'npm:standardwebhooks@1.0.0'
import { SMTPClient } from 'https://deno.land/x/denomailer@1.6.0/mod.ts'

const gmailUser = Deno.env.get('GMAIL_USER')!
const gmailAppPassword = Deno.env.get('GMAIL_APP_PASSWORD')!
// GoTrue stores/signs hook secrets as "v1,whsec_..." but strips the "v1,"
// prefix before handing the raw whsec_ value to its signing library
// (internal/hooks/hookshttp/hookshttp.go, generateSignatures). standardwebhooks
// here expects that same raw whsec_ value - passing the full "v1,whsec_..."
// string verifies against the wrong secret and fails every signature check.
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET')!.replace(/^v1,/, '')

const FROM_ADDRESS = `projet-x <${gmailUser}>`

interface HookPayload {
  user: {
    email: string
    user_metadata?: { locale?: string }
  }
  email_data: {
    token_hash: string
    redirect_to: string
    email_action_type: string
  }
}

interface RecoveryEmailCopy {
  subject: string
  heading: string
  body: string
  button: string
  fallbackNote: string
  ignoreNote: string
  dir?: 'rtl'
}

const RECOVERY_COPY: Record<string, RecoveryEmailCopy> = {
  fr: {
    subject: 'Réinitialisez votre mot de passe',
    heading: 'Réinitialisez votre mot de passe',
    body: 'Nous avons reçu une demande de réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.',
    button: 'Réinitialiser le mot de passe',
    fallbackNote: 'Si le bouton ne fonctionne pas, copiez-collez ce lien dans votre navigateur :',
    ignoreNote: "Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.",
  },
  en: {
    subject: 'Reset your password',
    heading: 'Reset your password',
    body: 'We received a request to reset your password. Click the button below to choose a new one.',
    button: 'Reset password',
    fallbackNote: "If the button doesn't work, copy and paste this link into your browser:",
    ignoreNote: "If you didn't request this, you can safely ignore this email.",
  },
  es: {
    subject: 'Restablece tu contraseña',
    heading: 'Restablece tu contraseña',
    body: 'Hemos recibido una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para elegir una nueva.',
    button: 'Restablecer contraseña',
    fallbackNote: 'Si el botón no funciona, copia y pega este enlace en tu navegador:',
    ignoreNote: 'Si no solicitaste esto, puedes ignorar este correo de forma segura.',
  },
  pt: {
    subject: 'Redefina a sua palavra-passe',
    heading: 'Redefina a sua palavra-passe',
    body: 'Recebemos um pedido para redefinir a sua palavra-passe. Clique no botão abaixo para escolher uma nova.',
    button: 'Redefinir palavra-passe',
    fallbackNote: 'Se o botão não funcionar, copie e cole este link no seu navegador:',
    ignoreNote: 'Se não foi você que solicitou isto, pode ignorar este e-mail com segurança.',
  },
  ar: {
    subject: 'إعادة تعيين كلمة المرور',
    heading: 'إعادة تعيين كلمة المرور',
    body: 'تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بك. انقر على الزر أدناه لاختيار كلمة مرور جديدة.',
    button: 'إعادة تعيين كلمة المرور',
    fallbackNote: 'إذا لم يعمل الزر، انسخ الرابط التالي والصقه في متصفحك:',
    ignoreNote: 'إذا لم تطلب ذلك، يمكنك تجاهل هذا البريد الإلكتروني بأمان.',
    dir: 'rtl',
  },
  sw: {
    subject: 'Weka upya nywila yako',
    heading: 'Weka upya nywila yako',
    body: 'Tumepokea ombi la kuweka upya nywila yako. Bofya kitufe hapa chini kuchagua nywila mpya.',
    button: 'Weka upya nywila',
    fallbackNote: 'Kama kitufe hakifanyi kazi, nakili na ubandike kiungo hiki kwenye kivinjari chako:',
    ignoreNote: 'Kama hukuomba hili, unaweza kupuuza barua pepe hii kwa usalama.',
  },
}

function resolveLocale(locale: string | undefined): keyof typeof RECOVERY_COPY {
  return locale !== undefined && locale in RECOVERY_COPY ? (locale as keyof typeof RECOVERY_COPY) : 'fr'
}

// Le lien pointe directement vers l'écran de l'app (redirect_to), avec le
// token en query params — jamais vers l'endpoint GoTrue /auth/v1/verify.
// L'écran (app/(auth)/reset-password.tsx) n'appelle verifyOtp() qu'après un
// clic humain explicite sur un bouton de confirmation : contrairement à un
// GET, un scanner anti-phishing qui ne fait que suivre/pré-charger le lien
// ne déclenche jamais cet appel API et ne consomme donc pas le token.
function buildResetLink(redirectTo: string, tokenHash: string): string {
  const url = new URL(redirectTo)
  url.searchParams.set('token_hash', tokenHash)
  url.searchParams.set('type', 'recovery')
  return url.toString()
}

function renderRecoveryEmail(locale: string | undefined, verifyUrl: string): { subject: string; html: string } {
  const copy = RECOVERY_COPY[resolveLocale(locale)]
  const dir = copy.dir ?? 'ltr'
  const align = dir === 'rtl' ? 'right' : 'left'

  const html = `<!doctype html>
<html dir="${dir}">
  <body style="margin:0;padding:0;background-color:#f5f5f4;font-family:-apple-system,Segoe UI,Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:32px;text-align:${align};" dir="${dir}">
                <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:#860101;letter-spacing:0.5px;">PROJET-X</p>
                <h1 style="margin:0 0 16px;font-size:20px;color:#1a1a1a;">${copy.heading}</h1>
                <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#4a4a49;">${copy.body}</p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:8px;background:#860101;">
                      <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${copy.button}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 4px;font-size:12px;color:#9a9a9a;">${copy.fallbackNote}</p>
                <p style="margin:0 0 24px;font-size:12px;color:#860101;word-break:break-all;">${verifyUrl}</p>
                <p style="margin:0;font-size:12px;color:#9a9a9a;">${copy.ignoreNote}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

  return { subject: copy.subject, html }
}

// GoTrue (Supabase Auth) only surfaces a hook's real error message to the
// client if the response body matches { error: { http_code, message } } -
// see internal/hooks/hookserrors/hookserrors.go. A flat { error: "..." }
// string fails to unmarshal there and silently falls back to a generic
// "Hook requires authorization token" message, regardless of the actual
// cause.
function hookError(httpCode: number, message: string): Response {
  return new Response(
    JSON.stringify({ error: { http_code: httpCode, message } }),
    { status: httpCode, headers: { 'Content-Type': 'application/json' } },
  )
}

Deno.serve(async (req) => {
  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)

  let data: HookPayload
  try {
    const wh = new Webhook(hookSecret)
    data = wh.verify(payload, headers) as HookPayload
  } catch {
    return hookError(401, 'Invalid webhook signature')
  }

  const { user, email_data } = data

  if (email_data.email_action_type !== 'recovery') {
    return hookError(400, `Unhandled email_action_type: ${email_data.email_action_type}`)
  }

  const locale = resolveLocale(user.user_metadata?.locale)
  const resetLink = buildResetLink(email_data.redirect_to, email_data.token_hash)

  const { subject, html } = renderRecoveryEmail(locale, resetLink)

  const client = new SMTPClient({
    connection: {
      hostname: 'smtp.gmail.com',
      port: 465,
      tls: true,
      auth: { username: gmailUser, password: gmailAppPassword },
    },
  })

  try {
    await client.send({
      from: FROM_ADDRESS,
      to: user.email,
      subject,
      html,
    })
  } catch (err) {
    console.error('[send-auth-email] SMTP error:', err instanceof Error ? err.message : String(err))
    return hookError(500, 'Failed to send email')
  } finally {
    await client.close()
  }

  return new Response(JSON.stringify({}), { status: 200, headers: { 'Content-Type': 'application/json' } })
})
