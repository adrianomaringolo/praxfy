'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
  Checkbox,
  DatePicker,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  toast,
} from 'buildgrid-ui'
import {
  Copy,
  Download,
  ExternalLink,
  Globe,
  Lock,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react'
import {
  setProjectTokenExpiry,
  toggleProjectToken,
  updateProjectStage,
} from '@/actions/projects'
import {
  createProjectLog,
  updateProjectLogVisibility,
} from '@/actions/project-logs'
import {
  createProjectLink,
  deleteProjectLink,
  updateProjectLinkVisibility,
} from '@/actions/project-links'
import {
  deleteProjectDocument,
  updateDocumentVisibility,
  uploadProjectDocument,
} from '@/actions/project-documents'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/format'
import type {
  PipelineStage,
  Project,
  ProjectDocument,
  ProjectLink,
  ProjectLog,
} from '@/db/schema'

interface ProjectDetailTabsProps {
  project: Project
  clientName: string
  pipelineName: string
  stages: PipelineStage[]
  logs: ProjectLog[]
  links: ProjectLink[]
  documents: ProjectDocument[]
}

function VisibilityBadge({ isPublic }: { isPublic: boolean | null }) {
  return isPublic ? (
    <span className="inline-flex items-center gap-1 text-xs text-success">
      <Globe size={12} /> Público
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-xs text-text-muted">
      <Lock size={12} /> Interno
    </span>
  )
}

function OverviewTab({
  project,
  clientName,
  pipelineName,
  stages,
}: Pick<
  ProjectDetailTabsProps,
  'project' | 'clientName' | 'pipelineName' | 'stages'
>) {
  const router = useRouter()
  const [moving, setMoving] = useState(false)

  async function handleStageChange(stageId: string) {
    if (stageId === project.currentStageId) return
    setMoving(true)
    const result = await updateProjectStage(project.id, stageId)
    setMoving(false)
    if (result.success) {
      toast.success('Etapa atualizada')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  const fields = [
    { label: 'Cliente', value: clientName },
    { label: 'Pipeline', value: pipelineName },
    {
      label: 'Valor',
      value: formatCurrency(project.value, project.currency ?? 'BRL'),
    },
    { label: 'Início', value: formatDate(project.startDate) },
    { label: 'Prazo', value: formatDate(project.dueDate) },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {fields.map((field) => (
          <div key={field.label}>
            <p className="text-xs font-medium tracking-wide uppercase text-text-muted">
              {field.label}
            </p>
            <p className="text-sm text-text-primary mt-1">{field.value}</p>
          </div>
        ))}
        <div>
          <p className="text-xs font-medium tracking-wide uppercase text-text-muted mb-1">
            Etapa atual
          </p>
          <Select
            value={project.currentStageId}
            onValueChange={handleStageChange}
            disabled={moving}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {stages.map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: stage.color }}
                    />
                    {stage.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {project.description && (
        <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-medium tracking-wide uppercase text-text-muted">
            Descrição
          </p>
          <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap">
            {project.description}
          </p>
        </div>
      )}

      <Button
        variant="outline"
        className="self-start"
        onClick={() => router.push(`/projects/${project.id}/edit`)}
      >
        Editar projeto
      </Button>
    </div>
  )
}

function LogsTab({
  project,
  logs,
}: Pick<ProjectDetailTabsProps, 'project' | 'logs'>) {
  const router = useRouter()
  const [content, setContent] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    const result = await createProjectLog(project.id, content, isPublic)
    setSubmitting(false)
    if (result.success) {
      toast.success('Atualização registrada')
      setContent('')
      setIsPublic(false)
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function handleToggleVisibility(log: ProjectLog) {
    const result = await updateProjectLogVisibility(log.id, !log.isPublic)
    if (result.success) {
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={handleSubmit}
        className="bg-surface-card rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3"
      >
        <Label htmlFor="log-content">Nova atualização</Label>
        <Textarea
          id="log-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Descreva o progresso do projeto..."
          rows={3}
          required
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <Checkbox
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked === true)}
            />
            Visível no portal do cliente
          </label>
          <Button type="submit" size="sm" isLoading={submitting}>
            <Plus size={16} className="mr-1" />
            Registrar
          </Button>
        </div>
      </form>

      {logs.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm font-medium text-text-primary">
            Nenhuma atualização ainda
          </p>
          <p className="text-sm text-text-muted">
            Registre o progresso do projeto para manter o histórico.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-surface-card rounded-xl border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-text-muted">
                  {formatDateTime(log.createdAt)}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleVisibility(log)}
                  title="Alternar visibilidade no portal"
                >
                  <VisibilityBadge isPublic={log.isPublic} />
                </button>
              </div>
              <p className="text-sm text-text-primary whitespace-pre-wrap">
                {log.content}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function LinksTab({
  project,
  links,
}: Pick<ProjectDetailTabsProps, 'project' | 'links'>) {
  const router = useRouter()
  const [label, setLabel] = useState('')
  const [url, setUrl] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState<ProjectLink | undefined>()

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    const result = await createProjectLink(project.id, label, url, isPublic)
    setSubmitting(false)
    if (result.success) {
      toast.success('Link adicionado')
      setLabel('')
      setUrl('')
      setIsPublic(false)
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    const result = await deleteProjectLink(deleting.id)
    setDeleting(undefined)
    if (result.success) {
      toast.success('Link excluído')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function handleToggleVisibility(link: ProjectLink) {
    const result = await updateProjectLinkVisibility(link.id, !link.isPublic)
    if (result.success) {
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <form
        onSubmit={handleSubmit}
        className="bg-surface-card rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Nome (ex: Repositório, Figma)"
            required
          />
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
            <Checkbox
              checked={isPublic}
              onCheckedChange={(checked) => setIsPublic(checked === true)}
            />
            Visível no portal do cliente
          </label>
          <Button type="submit" size="sm" isLoading={submitting}>
            <Plus size={16} className="mr-1" />
            Adicionar
          </Button>
        </div>
      </form>

      {links.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-6">
          Nenhum link adicionado.
        </p>
      ) : (
        <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          {links.map((link) => (
            <div key={link.id} className="flex items-center gap-3 px-4 py-3">
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline flex-1 min-w-0"
              >
                <ExternalLink size={14} className="shrink-0" />
                <span className="truncate">{link.label}</span>
              </a>
              <button
                type="button"
                onClick={() => handleToggleVisibility(link)}
                title="Alternar visibilidade no portal"
              >
                <VisibilityBadge isPublic={link.isPublic} />
              </button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Excluir link"
                onClick={() => setDeleting(link)}
              >
                <Trash2 size={16} className="text-danger" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir link</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir o link <strong>{deleting?.label}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-danger hover:bg-danger/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function DocumentsTab({
  project,
  documents,
}: Pick<ProjectDetailTabsProps, 'project' | 'documents'>) {
  const router = useRouter()
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState<ProjectDocument | undefined>()

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    const result = await uploadProjectDocument(project.id, formData)
    setUploading(false)
    event.target.value = ''
    if (result.success) {
      toast.success('Documento enviado')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function handleDelete() {
    if (!deleting) return
    const result = await deleteProjectDocument(deleting.id)
    setDeleting(undefined)
    if (result.success) {
      toast.success('Documento excluído')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function handleToggleVisibility(document: ProjectDocument) {
    const result = await updateDocumentVisibility(
      document.id,
      !document.isPublic
    )
    if (result.success) {
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <label className="bg-surface-card rounded-xl border-2 border-dashed border-gray-200 p-8 flex flex-col items-center gap-2 cursor-pointer hover:border-primary-300 transition-colors">
        <Upload size={32} className="text-text-muted" />
        <span className="text-sm font-medium text-text-primary">
          {uploading ? 'Enviando...' : 'Clique para enviar um arquivo'}
        </span>
        <span className="text-xs text-text-muted">
          PDF ou imagens, até 10MB
        </span>
        <input
          type="file"
          className="hidden"
          accept="application/pdf,image/*"
          onChange={handleFileChange}
          disabled={uploading}
        />
      </label>

      {documents.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-6">
          Nenhum documento enviado.
        </p>
      ) : (
        <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-100">
          {documents.map((document) => (
            <div
              key={document.id}
              className="flex items-center gap-3 px-4 py-3"
            >
              <a
                href={document.publicUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm font-medium text-primary-600 hover:underline flex-1 min-w-0"
              >
                <Download size={14} className="shrink-0" />
                <span className="truncate">{document.name}</span>
              </a>
              <button
                type="button"
                onClick={() => handleToggleVisibility(document)}
                title="Alternar visibilidade no portal"
              >
                <VisibilityBadge isPublic={document.isPublic} />
              </button>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Excluir documento"
                onClick={() => setDeleting(document)}
              >
                <Trash2 size={16} className="text-danger" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <AlertDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento</AlertDialogTitle>
            <AlertDialogDescription>
              Excluir <strong>{deleting?.name}</strong>? O arquivo será
              removido do armazenamento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-danger hover:bg-danger/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PortalTab({ project }: { project: Project }) {
  const router = useRouter()
  const [expiry, setExpiry] = useState<Date | undefined>(
    project.publicTokenExpiresAt ?? undefined
  )

  const portalUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ''}/p/${project.publicToken}`

  async function handleCopy() {
    await navigator.clipboard.writeText(portalUrl)
    toast.success('URL copiada')
  }

  async function handleToggle(active: boolean) {
    const result = await toggleProjectToken(project.id, active)
    if (result.success) {
      toast.success(active ? 'Portal ativado' : 'Portal desativado')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  async function handleExpiryChange(date: Date | undefined) {
    setExpiry(date)
    const result = await setProjectTokenExpiry(project.id, date ?? null)
    if (result.success) {
      toast.success(date ? 'Expiração definida' : 'Expiração removida')
      router.refresh()
    } else {
      toast.error(result.error)
    }
  }

  return (
    <div className="bg-surface-card rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-5 max-w-xl">
      <div className="flex flex-col gap-2">
        <Label>URL pública do portal</Label>
        <div className="flex gap-2">
          <Input value={portalUrl} readOnly className="flex-1 font-mono text-xs" />
          <Button variant="outline" size="icon" onClick={handleCopy} aria-label="Copiar URL">
            <Copy size={16} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label="Abrir portal"
            onClick={() => window.open(portalUrl, '_blank')}
          >
            <ExternalLink size={16} />
          </Button>
        </div>
        <p className="text-xs text-text-muted">
          Compartilhe esta URL com o cliente. Somente itens marcados como
          públicos aparecem no portal.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-primary">Portal ativo</p>
          <p className="text-xs text-text-muted">
            Desative para suspender o acesso do cliente.
          </p>
        </div>
        <Switch
          checked={project.publicTokenActive ?? false}
          onCheckedChange={handleToggle}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Expiração do acesso</Label>
        <div className="flex items-center gap-2">
          <DatePicker
            date={expiry}
            onDateChange={handleExpiryChange}
            placeholder="Sem expiração"
            language="ptBR"
          />
          {expiry && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleExpiryChange(undefined)}
            >
              Remover
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProjectDetailTabs(props: ProjectDetailTabsProps) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Visão Geral</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
        <TabsTrigger value="links">Links</TabsTrigger>
        <TabsTrigger value="documents">Documentos</TabsTrigger>
        <TabsTrigger value="portal">Portal</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="pt-4">
        <OverviewTab {...props} />
      </TabsContent>
      <TabsContent value="logs" className="pt-4">
        <LogsTab project={props.project} logs={props.logs} />
      </TabsContent>
      <TabsContent value="links" className="pt-4">
        <LinksTab project={props.project} links={props.links} />
      </TabsContent>
      <TabsContent value="documents" className="pt-4">
        <DocumentsTab project={props.project} documents={props.documents} />
      </TabsContent>
      <TabsContent value="portal" className="pt-4">
        <PortalTab project={props.project} />
      </TabsContent>
    </Tabs>
  )
}
