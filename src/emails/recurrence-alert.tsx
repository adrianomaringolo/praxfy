import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface RecurrenceAlertProps {
  recurrenceName: string
  clientName?: string
  scheduledDate: string
  linkUrl: string
}

export default function RecurrenceAlert({
  recurrenceName,
  clientName,
  scheduledDate,
  linkUrl,
}: RecurrenceAlertProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Recorrência vencendo: {recurrenceName}</Preview>
      <Body style={{ backgroundColor: '#f8f7ff', fontFamily: 'sans-serif' }}>
        <Container
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 12,
            padding: 32,
            margin: '40px auto',
            maxWidth: 480,
          }}
        >
          <Heading
            as="h1"
            style={{ color: '#1e1b4b', fontSize: 20, marginBottom: 8 }}
          >
            Lembrete de recorrência
          </Heading>
          <Text style={{ color: '#6b7280', fontSize: 14 }}>
            A recorrência <strong>{recurrenceName}</strong>
            {clientName ? (
              <>
                {' '}
                do cliente <strong>{clientName}</strong>
              </>
            ) : null}{' '}
            está prevista para <strong>{scheduledDate}</strong>.
          </Text>
          <Section style={{ textAlign: 'center', marginTop: 24 }}>
            <Button
              href={linkUrl}
              style={{
                backgroundColor: '#4f46e5',
                color: '#ffffff',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Ver no Praxfy
            </Button>
          </Section>
          <Text
            style={{
              color: '#9ca3af',
              fontSize: 12,
              textAlign: 'center',
              marginTop: 32,
            }}
          >
            Acompanhamento gerado pelo Praxfy
          </Text>
        </Container>
      </Body>
    </Html>
  )
}
