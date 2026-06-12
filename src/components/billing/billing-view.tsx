'use client'

import { useState } from 'react'
import { Button, toast } from 'buildgrid-ui'
import { Check } from 'lucide-react'
import { PLANS, type PlanId } from '@/lib/plans'
import { formatCurrency } from '@/lib/format'

interface Usage {
  resource: string
  label: string
  current: number
  limit: number
}

export function BillingView({
  planId,
  usage,
  hasStripeCustomer,
}: {
  planId: PlanId
  usage: Usage[]
  hasStripeCustomer: boolean
}) {
  const [loading, setLoading] = useState(false)

  async function callStripe(endpoint: 'checkout' | 'portal') {
    setLoading(true)
    try {
      const response = await fetch(`/api/stripe/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: endpoint === 'checkout' ? JSON.stringify({}) : undefined,
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error ?? 'Não foi possível abrir o Stripe.')
        setLoading(false)
      }
    } catch {
      toast.error('Erro de conexão com o Stripe.')
      setLoading(false)
    }
  }

  const currentPlan = PLANS[planId]

  return (
    <div className="flex flex-col gap-6">
      {/* Plano atual + uso */}
      <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm p-5">
        <p className="text-xs font-medium tracking-wide uppercase text-text-muted">
          Plano atual
        </p>
        <p className="text-2xl font-display font-bold text-text-primary mt-1">
          {currentPlan.name}
        </p>
        {planId === 'FREE' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
            {usage.map((item) => {
              const ratio =
                item.limit === Infinity ? 0 : item.current / item.limit
              return (
                <div key={item.resource}>
                  <p className="text-xs text-text-muted">{item.label}</p>
                  <p className="text-sm font-medium text-text-primary">
                    {item.current} /{' '}
                    {item.limit === Infinity ? '∞' : item.limit}
                  </p>
                  <div className="h-1.5 bg-surface-muted rounded-full mt-1 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        ratio >= 1 ? 'bg-danger' : 'bg-primary-600'
                      }`}
                      style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Cards dos planos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
        {(Object.keys(PLANS) as PlanId[]).map((id) => {
          const plan = PLANS[id]
          const isCurrent = id === planId
          return (
            <div
              key={id}
              className={`bg-surface-card rounded-xl border shadow-sm p-6 flex flex-col gap-4 ${
                id === 'PRO' ? 'border-primary-300' : 'border-gray-100'
              }`}
            >
              <div>
                <h2 className="text-lg font-display font-semibold text-text-primary">
                  {plan.name}
                </h2>
                <p className="text-3xl font-display font-bold text-primary-700 mt-1">
                  {plan.price === 0
                    ? 'R$ 0'
                    : formatCurrency(plan.price / 100)}
                  <span className="text-sm font-normal text-text-muted">
                    /mês
                  </span>
                </p>
              </div>
              <ul className="flex flex-col gap-2 flex-1">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-2 text-sm text-text-secondary"
                  >
                    <Check size={14} className="text-success shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              {isCurrent ? (
                <Button variant="outline" disabled>
                  Plano atual
                </Button>
              ) : id === 'PRO' ? (
                <Button
                  onClick={() => callStripe('checkout')}
                  isLoading={loading}
                  disabled={loading}
                >
                  Fazer upgrade
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => callStripe('portal')}
                  isLoading={loading}
                  disabled={loading || !hasStripeCustomer}
                >
                  Gerenciar assinatura
                </Button>
              )}
            </div>
          )
        })}
      </div>

      {planId === 'PRO' && hasStripeCustomer && (
        <Button
          variant="outline"
          className="self-start"
          onClick={() => callStripe('portal')}
          isLoading={loading}
          disabled={loading}
        >
          Gerenciar assinatura no Stripe
        </Button>
      )}
    </div>
  )
}
