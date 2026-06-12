/**
 * Seed de desenvolvimento.
 * Uso: npx tsx src/db/seed.ts
 * Cria um usuário demo (clerkId 'seed_demo_user') com dados fictícios.
 */
import { config } from 'dotenv'
config({ path: '.env.local' })

import { nanoid } from 'nanoid'
import { addDays, format, subDays } from 'date-fns'
import { eq } from 'drizzle-orm'

async function main() {
  // Imports tardios para garantir que o dotenv carregou antes da conexão
  const { db } = await import('./index')
  const schema = await import('./schema')

  const today = new Date()
  const iso = (date: Date) => format(date, 'yyyy-MM-dd')

  // Usuário demo (idempotente)
  const [existing] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.clerkId, 'seed_demo_user'))
  if (existing) {
    console.log('Seed já executado (usuário demo existe). Abortando.')
    process.exit(0)
  }

  const [user] = await db
    .insert(schema.users)
    .values({
      clerkId: 'seed_demo_user',
      name: 'Profissional Demo',
      email: 'demo@praxfy.dev',
    })
    .returning()
  console.log('✓ Usuário demo criado')

  // 2 clientes
  const [clientA, clientB] = await db
    .insert(schema.clients)
    .values([
      {
        userId: user.id,
        name: 'Padaria Estrela',
        email: 'contato@padariaestrela.com.br',
        phone: '(11) 98888-1111',
        tags: ['varejo', 'site'],
        notes: 'Cliente desde 2024. Prefere contato por WhatsApp.',
      },
      {
        userId: user.id,
        name: 'Clínica Bem Viver',
        email: 'adm@bemviver.med.br',
        phone: '(11) 97777-2222',
        tags: ['saúde'],
      },
    ])
    .returning()
  console.log('✓ 2 clientes criados')

  // Pipeline com 5 etapas
  const [pipeline] = await db
    .insert(schema.pipelines)
    .values({
      userId: user.id,
      name: 'Projetos Web',
      description: 'Fluxo padrão de projetos de site',
    })
    .returning()

  const stages = await db
    .insert(schema.pipelineStages)
    .values(
      [
        { name: 'Briefing', color: '#3b82f6' },
        { name: 'Design', color: '#8b5cf6' },
        { name: 'Desenvolvimento', color: '#f59e0b' },
        { name: 'Revisão', color: '#ec4899' },
        { name: 'Entregue', color: '#10b981' },
      ].map((stage, order) => ({ ...stage, pipelineId: pipeline.id, order }))
    )
    .returning()
  console.log('✓ Pipeline "Projetos Web" com 5 etapas')

  // 2 projetos em etapas diferentes
  const [projectA, projectB] = await db
    .insert(schema.projects)
    .values([
      {
        userId: user.id,
        clientId: clientA.id,
        pipelineId: pipeline.id,
        currentStageId: stages[2].id,
        name: 'Site institucional Padaria Estrela',
        description: 'Site de 5 páginas com cardápio e formulário de contato.',
        value: '4500.00',
        startDate: iso(subDays(today, 20)),
        dueDate: iso(addDays(today, 25)),
        publicToken: nanoid(16),
      },
      {
        userId: user.id,
        clientId: clientB.id,
        pipelineId: pipeline.id,
        currentStageId: stages[0].id,
        name: 'Landing page Bem Viver',
        description: 'Página de captação para campanha de check-up.',
        value: '1800.00',
        startDate: iso(subDays(today, 3)),
        dueDate: iso(addDays(today, 15)),
        publicToken: nanoid(16),
      },
    ])
    .returning()

  await db.insert(schema.projectLogs).values([
    {
      projectId: projectA.id,
      stageId: stages[0].id,
      content: 'Briefing aprovado com o cliente.',
      isPublic: true,
    },
    {
      projectId: projectA.id,
      stageId: stages[1].id,
      content: 'Layout das páginas internas aprovado.',
      isPublic: true,
    },
    {
      projectId: projectA.id,
      stageId: stages[2].id,
      content: 'Iniciado o desenvolvimento. Nota interna: aguardar fotos.',
      isPublic: false,
    },
    {
      projectId: projectB.id,
      stageId: stages[0].id,
      content: 'Reunião de briefing agendada.',
      isPublic: true,
    },
  ])

  await db.insert(schema.projectLinks).values([
    {
      projectId: projectA.id,
      label: 'Ambiente de homologação',
      url: 'https://staging.padariaestrela.com.br',
      isPublic: true,
    },
    {
      projectId: projectA.id,
      label: 'Repositório',
      url: 'https://github.com/demo/padaria-estrela',
      isPublic: false,
    },
    {
      projectId: projectB.id,
      label: 'Figma',
      url: 'https://figma.com/file/demo-bem-viver',
      isPublic: false,
    },
  ])
  console.log('✓ 2 projetos com logs e links')

  // 1 contrato com 1 recorrência mensal
  const [contract] = await db
    .insert(schema.contracts)
    .values({
      userId: user.id,
      clientId: clientA.id,
      name: 'Manutenção mensal do site',
      description: 'Atualizações de conteúdo e backup mensal.',
      value: '350.00',
      status: 'active',
      publicToken: nanoid(16),
    })
    .returning()

  const nextDate = iso(addDays(today, 5))
  const [recurrence] = await db
    .insert(schema.recurrences)
    .values({
      userId: user.id,
      contractId: contract.id,
      name: 'Backup e atualização mensal',
      frequencyType: 'months',
      frequencyValue: 1,
      startDate: nextDate,
      nextOccurrenceAt: nextDate,
      notifyEmails: ['demo@praxfy.dev'],
    })
    .returning()

  await db.insert(schema.recurrenceOccurrences).values({
    recurrenceId: recurrence.id,
    scheduledAt: nextDate,
    status: 'pending',
  })
  console.log('✓ 1 contrato com recorrência mensal')

  console.log('\nSeed concluído! Tokens dos portais:')
  console.log(`  Projeto A: /p/${projectA.publicToken}`)
  console.log(`  Projeto B: /p/${projectB.publicToken}`)
  console.log(`  Contrato:  /p/${contract.publicToken}`)
  process.exit(0)
}

main().catch((error) => {
  console.error('Erro no seed:', error)
  process.exit(1)
})
