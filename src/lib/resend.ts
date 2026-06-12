import { Resend } from 'resend'

let client: Resend | null = null

/** Cliente Resend sob demanda — não quebra o build sem RESEND_API_KEY */
export function getResend() {
  if (!client) {
    client = new Resend(process.env.RESEND_API_KEY)
  }
  return client
}

export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? 'Praxfy <onboarding@resend.dev>'
