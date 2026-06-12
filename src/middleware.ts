import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Rotas públicas: landing, auth, portal do cliente, cron e webhook do Stripe.
// Todo o resto (grupo `(app)`) exige sessão autenticada.
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/p/(.*)',
  '/api/cron/(.*)',
  '/api/stripe/webhook(.*)',
])

export default clerkMiddleware(async (auth, request) => {
  if (!isPublicRoute(request)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Pular internals do Next.js e arquivos estáticos
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Sempre rodar em rotas de API
    '/(api|trpc)(.*)',
  ],
}
