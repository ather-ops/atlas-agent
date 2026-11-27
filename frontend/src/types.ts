export type Preferences = {
  name: string
  theme: 'light' | 'dark' | 'system'
  provider: 'auto' | 'local'
  model: string
  style: 'balanced' | 'concise' | 'detailed'
  use_context: boolean
  allow_network: boolean
}
export type Connection = {
  id: string
  name: string
  description: string
  permission: string
  status: 'connected' | 'coming_soon' | 'available' | 'configured' | 'error'
  managed: boolean
}
export type Summary = { id: string; title: string; created_at: string; updated_at: string }
export type Step = {
  type: string
  label?: string
  status: string
  name?: string
  id?: string
  filename?: string
  content?: string
}
export type Attachment = { name: string; text: string }
export type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  status: string
  activity: Step[]
  attachment?: Attachment | null
  created_at?: string
}
export type Detail = Summary & { messages: Message[] }
export type Workspace = {
  preferences: Preferences
  status: { ready: boolean; mode: 'local' | 'groq'; model: string; groq_configured: boolean }
  conversations: Summary[]
  stats: { conversations: number; messages: number; tool_runs: number; workflow_runs: number }
  integrations: Connection[]
  version: string
}
export type Run = { id: string; status: string; created_at: string; result: string }
export type Workflow = {
  id: string
  name: string
  description: string
  tool: string
  arguments: Record<string, string>
  status: 'active' | 'paused' | 'failed'
  schedule: string
  created_at: string
  runs: Run[]
}
export type StreamEvent =
  | { type: 'start'; conversation_id: string; session_id: string; message_id: string }
  | { type: 'delta'; text: string }
  | { type: 'error'; text: string }
  | { type: 'done'; status: string }
  | (Step & { type: 'activity' | 'tool' | 'approval' })
