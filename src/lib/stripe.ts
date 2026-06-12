import Stripe from 'stripe'

let client: Stripe | null = null

/**
 * Cliente Stripe server-side, inicializado sob demanda para não quebrar
 * o build quando STRIPE_SECRET_KEY ainda não está configurada.
 * apiVersion omitido de propósito: usa a versão fixada pelo SDK instalado.
 */
export function getStripe() {
  if (!client) {
    client = new Stripe(process.env.STRIPE_SECRET_KEY!)
  }
  return client
}
