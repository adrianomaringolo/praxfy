import { redirect } from 'next/navigation'
import { auth } from '@clerk/nextjs/server'
import { getUserByClerkId } from '@/db/queries/users'
import { getPipelines } from '@/db/queries/pipelines'
import { OnboardingForm } from '@/components/onboarding/onboarding-form'

export default async function OnboardingPage() {
  const { userId: clerkId } = await auth()
  if (!clerkId) redirect('/sign-in')

  const user = await getUserByClerkId(clerkId)
  if (user) {
    const pipelines = await getPipelines(user.id)
    if (pipelines.length > 0) redirect('/dashboard')
  }

  return (
    <div className="flex flex-col items-center px-4 py-10 md:py-16">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-display font-bold text-text-primary">
          Bem-vindo ao Praxfy!
        </h1>
        <p className="text-sm text-text-secondary mt-1 mb-8">
          Para começar, crie seu primeiro pipeline — as etapas pelas quais
          seus projetos passam, da entrada à entrega.
        </p>
        <OnboardingForm />
      </div>
    </div>
  )
}
