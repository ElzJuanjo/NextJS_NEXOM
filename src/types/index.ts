// ═══════════════════════════════════════════════════════════════════════════
// Types — 1:1 mirror of FastAPI-NexOS DTOs
// ═══════════════════════════════════════════════════════════════════════════

// ── Auth ────────────────────────────────────────────────────────────────────

export interface UserResponse {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  is_active: boolean;
  is_verified: boolean;
  is_2fa_enabled: boolean;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface AuthResponse {
  user: UserResponse;
  tokens: TokenResponse;
}

export interface AuthLoginResponse {
  user: UserResponse | null;
  tokens: TokenResponse | null;
  requires_2fa: boolean;
  temp_token: string | null;
}

export interface VerifyEmailResponse {
  message: string;
  is_verified: boolean;
}

export interface ReferralInfo {
  referral_code: string;
  referral_link: string;
  total_referrals: number;
}

export interface ReferralDetailInfo {
  referral_code: string;
  referral_link: string;
  total_referrals: number;
  credits_earned: number;
  referrals: Array<{ email: string; name: string; joined_at: string }>;
}

// ── Plans ───────────────────────────────────────────────────────────────────

export interface PlanResponse {
  id: string;
  name: string;
  plan_type: string;
  max_credits_per_month: number;
  price_monthly_usd: number;
  price_yearly_usd: number;
}

// ── Organizations ───────────────────────────────────────────────────────────

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  timezone: string;
  credits_used_this_month: number;
  plan: PlanResponse;
  created_at: string;
}

export interface OrgUsage {
  organization_id: string;
  plan: string;
  credits: {
    used: number;
    total: number;
    remaining: number;
    percentage_used: number;
  };
  cost_table: Record<string, number>;
  examples: Record<string, number>;
}

// ── Brands ──────────────────────────────────────────────────────────────────

export interface BrandResponse {
  id: string;
  organization_id: string;
  name: string;
  tagline: string | null;
  status: string;
  color_palette: Record<string, string> | null;
  typography: Record<string, string> | null;
  tones: string[] | null;
  key_messages: string[] | null;
  brand_identity: Record<string, any> | null;
  created_at: string;
}

// ── Products ────────────────────────────────────────────────────────────────

export interface ProductResponse {
  id: string;
  organization_id: string;
  brand_id: string | null;
  name: string;
  description: string | null;
  sku: string | null;
  price_usd: number | null;
  image_url: string | null;
  is_active: boolean;
  dropi_product_id: string | null;
  extra_data: Record<string, unknown> | null;
  created_at: string;
}

// ── Agents ──────────────────────────────────────────────────────────────────

export interface AvailableAgent {
  agent_type: string;
  credits_per_use: number;
}

export interface AgentTaskResponse {
  id: string;
  organization_id: string;
  agent_type: string;
  flow_step_id: string | null;
  status: string;
  input_payload: Record<string, unknown> | null;
  output_payload: Record<string, unknown> | null;
  error_message: string | null;
  credits_used: number | null;
  duration_ms: number | null;
  started_at: string | null;
  finished_at: string | null;
  created_at: string;
}

export interface ExecuteAgentResponse {
  task_id: string;
  agent_type: string;
  status: string;
  content: string | null;
  error_message: string | null;
  credits_used: number | null;
  duration_ms: number | null;
  model: string | null;
  scraped_sources: Record<string, unknown> | null;
  images: string[] | null;
  image_count: number | null;
  created_at: string;
}

// ── Flows ───────────────────────────────────────────────────────────────────

export interface FlowStepResponse {
  id: string;
  flow_id: string;
  agent_type: string;
  name: string;
  order: number;
  status: string;
  depends_on_step_id: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface FlowResponse {
  id: string;
  organization_id: string;
  name: string;
  status: string;
  progress_pct: number;
  started_at: string | null;
  completed_at: string | null;
  context: Record<string, unknown> | null;
  steps: FlowStepResponse[];
  created_at: string;
}

export interface StepResultSummary {
  agent_type: string | null;
  status: string | null;
  content_preview: string | null;
  tokens: number;
  duration_ms: number;
  error: string | null;
}

export interface ExecuteFlowResponse {
  flow_id: string;
  status: string;
  total_steps: number;
  completed_steps: number;
  total_tokens: number;
  total_duration_ms: number;
  step_results: Record<string, StepResultSummary>;
  error: string | null;
}

// ── Flow Templates ──────────────────────────────────────────────────────────

export interface FlowTemplateInfo {
  template_id: string;
  name: string;
  description: string;
  total_steps: number;
  agents: string[];
}

// ── Creatives ───────────────────────────────────────────────────────────────

export interface CreativeResponse {
  id: string;
  organization_id: string;
  product_id: string | null;
  batch_id: string | null;
  agent_type: string;
  status: string;
  file_url: string | null;
  file_size_bytes: number | null;
  style: string | null;
  format: string | null;
  platform: string | null;
  angle: string | null;
  generation_prompt: string | null;
  generation_params: Record<string, unknown> | null;
  created_at: string;
}

// ── Creative Batches ────────────────────────────────────────────────────────

export interface CreativeBatchPreset {
  preset_id: string;
  name: string;
  total_images: number;
  credits_cost: number;
  angles: string[];
  formats: string[];
  styles: string[];
}

export interface CreativeBatchResponse {
  id: string;
  organization_id: string;
  product_id: string | null;
  name: string;
  status: string;
  total_expected: number;
  total_generated: number;
  total_failed: number;
  credits_consumed: number;
  config: Record<string, unknown> | null;
  creatives: CreativeResponse[];
  created_at: string;
}

// ── Landing Pages ───────────────────────────────────────────────────────────

export interface LandingSectionResponse {
  id: string;
  landing_page_id: string;
  section_type: string;
  title: string | null;
  body: string | null;
  cta_text: string | null;
  cta_url: string | null;
  order: number;
  is_visible: boolean;
  content: Record<string, unknown> | null;
  created_at: string;
}

export interface LandingPageResponse {
  id: string;
  organization_id: string;
  brand_id: string | null;
  name: string;
  campaign: string | null;
  status: string;
  published_url: string | null;
  published_at: string | null;
  sections: LandingSectionResponse[];
  created_at: string;
}

// ── Orchestrator ────────────────────────────────────────────────────────────

export interface OrchestratorResponse {
  content: string | null;
  selected_agent: string | null;
  router_reasoning: string | null;
  model: string | null;
  tokens_used: number | null;
  scraped_sources: Record<string, unknown> | null;
  dropi_data: Record<string, unknown> | null;
  images: string[] | null;
  image_count: number | null;
  error: string | null;
  credits_consumed: number | null;
  credits_remaining: number | null;
}

// ── UI Helpers ──────────────────────────────────────────────────────────────

export type AgentType =
  | "general_assistant"
  | "product_search"
  | "dropi_connector"
  | "branding"
  | "copywriting"
  | "ads"
  | "landing_page"
  | "store_dev"
  | "image_gen"
  | "conversion_opt";

export interface AgentMeta {
  id: AgentType;
  label: string;
  color: string;
  activeBg: string;
}

// ── Copy Assets ────────────────────────────────────────────────────────────

export interface CopyAssetResponse {
  id: string;
  organization_id: string;
  brand_id: string | null;
  product_id: string | null;
  name: string;
  copy_type: string;
  platform: string | null;
  tone: string | null;
  content: string;
  status: string;
  variations: Array<{ content: string; order: number }> | null;
  created_at: string;
  updated_at: string;
}

// ── Conversations ───────────────────────────────────────────────────────────

export interface ConversationMessageResponse {
  id: string;
  role: string;
  content: string;
  agent_type: string | null;
  meta_data: Record<string, unknown> | null;
  created_at: string;
}

export interface ConversationResponse {
  id: string;
  organization_id: string;
  user_id: string;
  title: string | null;
  agent_type: string | null;
  is_archived: boolean;
  message_count: number;
  last_message_at: string | null;
  created_at: string;
}

export interface ConversationDetailResponse extends ConversationResponse {
  messages: ConversationMessageResponse[];
}

export interface SendMessageResponse {
  conversation_id: string;
  message: ConversationMessageResponse;
  response: ConversationMessageResponse;
  credits_consumed: number | null;
  credits_remaining: number | null;
}

export const AGENT_META: AgentMeta[] = [
  { id: "general_assistant", label: "General", color: "text-violet-400", activeBg: "bg-violet-400/10" },
  { id: "product_search", label: "Productos", color: "text-emerald-400", activeBg: "bg-emerald-400/10" },
  { id: "dropi_connector", label: "Dropi", color: "text-cyan-400", activeBg: "bg-cyan-400/10" },
  { id: "branding", label: "Branding", color: "text-pink-400", activeBg: "bg-pink-400/10" },
  { id: "copywriting", label: "Copywriting", color: "text-amber-400", activeBg: "bg-amber-400/10" },
  { id: "ads", label: "Ads", color: "text-orange-400", activeBg: "bg-orange-400/10" },
  { id: "landing_page", label: "Landing", color: "text-blue-400", activeBg: "bg-blue-400/10" },
  { id: "store_dev", label: "Tienda", color: "text-indigo-400", activeBg: "bg-indigo-400/10" },
  { id: "image_gen", label: "Imágenes", color: "text-rose-400", activeBg: "bg-rose-400/10" },
  { id: "conversion_opt", label: "Conversión", color: "text-teal-400", activeBg: "bg-teal-400/10" },
];