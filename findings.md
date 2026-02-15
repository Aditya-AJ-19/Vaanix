# 🔍 Vaanix — Technical Findings & Architecture Decisions

> Analysis of constraints, tradeoffs, and strategic decisions for Voice Agent SaaS Platform

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Key Architecture Decisions](#key-architecture-decisions)
3. [Technical Risks](#technical-risks)
4. [Tradeoffs Analysis](#tradeoffs-analysis)
5. [Multi-Tenant SaaS Considerations](#multi-tenant-saas-considerations)
6. [Voice Infrastructure Analysis](#voice-infrastructure-analysis)
7. [Unknowns Requiring Validation](#unknowns-requiring-validation)
8. [India-First Constraints](#india-first-constraints)
9. [Phase 0 Implementation Findings](#phase-0-implementation-findings)

---

## 🏗️ Architecture Overview

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (Next.js)                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │  Dashboard  │  │ Agent       │  │  Analytics  │  │   Billing   │    │
│  │             │  │ Builder     │  │             │  │             │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │ REST API + WebSocket
                                 ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (Express)                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │   Auth   │  │  Agent   │  │Knowledge │  │  Channel │  │ Billing  │  │
│  │ Middleware│  │  Routes  │  │  Routes  │  │  Routes  │  │  Routes  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────────────────┐
│   PostgreSQL    │   │      Redis      │   │      Voice Runtime          │
│     (Neon)      │   │  Cache + Queue  │   │  ┌─────┐ ┌─────┐ ┌─────┐   │
│                 │   │                 │   │  │ STT │ │ LLM │ │ TTS │   │
│ • Organizations │   │ • Session cache │   │  └─────┘ └─────┘ └─────┘   │
│ • Users         │   │ • BullMQ jobs   │   │                             │
│ • Agents        │   │ • Rate limits   │   │  ┌─────────────────────┐   │
│ • Deployments   │   │                 │   │  │  Vector Store       │   │
│ • Knowledge     │   └─────────────────┘   │  │  (pgvector/Pinecone)│   │
│ • Leads         │                         │  └─────────────────────┘   │
│ • Usage         │                         └─────────────────────────────┘
└─────────────────┘
         │
         │ Webhooks/Events
         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        CHANNEL ADAPTERS                                 │
│  ┌─────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐ │
│  │ Web Widget  │  │    Telephony    │  │       WhatsApp              │ │
│  │  (Embed)    │  │ (Twilio/Exotel) │  │    (Business API)           │ │
│  └─────────────┘  └─────────────────┘  └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
```

### Design Philosophy

**Modular Monolith First** — Start as a single deployable unit with clear module boundaries. Extract to services only when:
- Scale demands it
- Team structure requires it
- Deployment independence is critical

---

## 🎯 Key Architecture Decisions

### ADR-001: Modular Monolith over Microservices

**Decision:** Build as a modular monolith, not microservices.

**Context:**
- Small team starting out
- Need fast iteration speed
- Budget constraints for infrastructure
- No proven scale requirements yet

**Consequences:**
- ✅ Faster development velocity
- ✅ Simpler deployment and debugging
- ✅ Lower infrastructure costs
- ✅ Easier refactoring
- ⚠️ Must maintain module boundaries strictly
- ⚠️ Voice runtime may need extraction later

---

### ADR-002: Shared Database with Tenant Isolation

**Decision:** Single PostgreSQL database with `organization_id` based row-level isolation.

**Rationale:**
- Simpler operations than database-per-tenant
- Neon serverless makes this cost-effective
- Row-level security (RLS) provides strong isolation
- Easier cross-tenant analytics later

**Schema Pattern:**
```sql
-- Every tenant-scoped table includes:
organization_id UUID NOT NULL REFERENCES organizations(id),
-- Index for tenant queries:
CREATE INDEX idx_<table>_org ON <table>(organization_id);
```

---

### ADR-003: Clerk for Authentication + Custom RBAC

**Decision:** Use Clerk for auth, build custom RBAC on top.

**Rationale:**
- Clerk handles auth complexity (SSO, MFA, session management)
- Clerk Organizations maps to our multi-tenancy
- Custom RBAC gives flexibility for feature-based permissions
- Avoids building auth from scratch

**Implementation:**
```typescript
// Clerk provides: userId, orgId, orgRole
// We extend with: custom permissions per feature
type Permission = 'agent:create' | 'agent:delete' | 'billing:manage' | ...
```

---

### ADR-004: Abstract Voice Provider Layer

**Decision:** Create abstraction layer for STT, TTS, and LLM providers.

**Rationale:**
- India market needs regional language support
- Provider landscape is evolving rapidly
- Cost optimization may require provider switching
- Different quality/cost tradeoffs per use case

**Interface Pattern:**
```typescript
interface STTProvider {
  transcribe(audio: Buffer, options: STTOptions): Promise<Transcript>;
}

interface TTSProvider {
  synthesize(text: string, options: TTSOptions): Promise<Buffer>;
}

interface LLMProvider {
  complete(messages: Message[], context: Context): Promise<Response>;
}
```

---

### ADR-005: BullMQ for Job Processing

**Decision:** Use BullMQ with Redis for background jobs.

**Use Cases:**
- Knowledge document processing
- Vector embedding generation
- Usage aggregation
- Notification delivery
- Report generation

**Rationale:**
- Battle-tested in Node.js ecosystem
- Redis already needed for caching
- Good observability (Bull Board)
- Supports job priorities and retries

---

### ADR-006: Vector Storage Strategy

**Decision:** Start with pgvector, migrate to dedicated vector DB if needed.

**Phase 1 (MVP):**
- pgvector in Neon PostgreSQL
- Simple, no additional infrastructure
- Good enough for <100K vectors

**Phase 2 (Scale):**
- Migrate to Pinecone/Qdrant if:
  - Query latency becomes issue
  - Vector count exceeds 1M
  - Advanced search features needed

---

### ADR-007: Separation of Agent Runtime

**Decision:** Design voice runtime as separable module from day one.

**Rationale:**
- Real-time voice processing has different scaling needs
- May need to deploy closer to users (edge)
- Different resource requirements (GPU for faster inference)
- Enables independent scaling

**Implementation:**
- Voice runtime communicates via message queue
- Stateless design with session in Redis
- Can be extracted to separate service later

---

## ⚠️ Technical Risks

### Risk Matrix

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Voice latency in India | High | High | Edge deployment, provider selection benchmarks |
| Clerk org limits | Medium | Medium | Validate limits early, plan fallback |
| React Flow performance | Medium | Medium | Virtualization, node limits, lazy loading |
| Vector search quality | Medium | High | Chunk strategies, reranking, evaluation suite |
| WhatsApp API approval | High | Medium | Apply early, have alternative channels ready |
| Neon cold starts | Medium | Low | Warm-up endpoints, connection pooling |
| TTS quality (Hindi) | High | High | Multi-provider testing, custom voice training |

### Detailed Risk Analysis

#### 🔴 R1: Voice Latency (HIGH)

**Problem:** India's internet infrastructure varies significantly. Real-time voice needs <300ms total round-trip.

**Components:**
- STT latency: 100-500ms
- LLM inference: 200-2000ms
- TTS latency: 100-500ms
- Network: Variable

**Mitigations:**
1. Use streaming responses where possible
2. Select providers with India presence
3. Implement response chunking for TTS
4. Consider edge deployment for voice runtime
5. Use local cache for common responses

---

#### 🔴 R2: TTS Quality for Indian Languages (HIGH)

**Problem:** Most TTS providers optimize for English. Hindi/Tamil/Bengali quality varies.

**Mitigations:**
1. Benchmark multiple providers:
   - Azure Cognitive Services (has Hindi)
   - Google Cloud TTS (has Hindi)
   - ElevenLabs (English focus)
   - Bhashini (Govt of India)
   - Vakyansh (IIT)
2. Build provider fallback chain
3. Consider fine-tuned models later

---

#### 🟡 R3: React Flow for Complex Workflows (MEDIUM)

**Problem:** Visual builders can become slow with many nodes.

**Mitigations:**
1. Implement viewport virtualization
2. Set node limits with clear upgrade path
3. Use lazy loading for node details
4. Optimize re-render with memoization
5. Consider Zustrand for state management

---

#### 🟡 R4: Knowledge Retrieval Quality (MEDIUM)

**Problem:** RAG systems can retrieve irrelevant context, causing poor responses.

**Mitigations:**
1. Implement multiple chunking strategies
2. Add reranking layer (Cohere, custom)
3. Build evaluation suite for quality
4. Enable human feedback loop
5. Hybrid search (keyword + semantic)

---

## ⚖️ Tradeoffs Analysis

### T1: Real-time vs Near-real-time Voice

| Approach | Pros | Cons |
|----------|------|------|
| **WebSocket Streaming** | Lower perceived latency | Complex implementation, edge deployment needed |
| **HTTP Request/Response** | Simpler, works everywhere | Higher latency, full response waiting |

**Decision:** Start with HTTP for MVP, add streaming for production scale.

---

### T2: Webhook vs Polling for Integrations

| Approach | Pros | Cons |
|----------|------|------|
| **Webhooks** | Real-time, efficient | Delivery guarantees, retry logic needed |
| **Polling** | Reliable, simpler | Higher latency, API rate limits |

**Decision:** Primary = Webhooks, Fallback = Polling for critical syncs.

---

### T3: Multi-tenant Data Isolation

| Approach | Pros | Cons |
|----------|------|------|
| **DB per Tenant** | Strong isolation, easy backup | High ops cost, migration complexity |
| **Schema per Tenant** | Good isolation, moderate complexity | Connection management |
| **Shared with RLS** | Simple, cost-effective | Requires careful query design |

**Decision:** Shared DB with RLS — right for current scale and budget.

---

### T4: Embedding Model Selection

| Model | Pros | Cons |
|-------|------|------|
| **OpenAI ada-002** | High quality, easy API | Cost at scale, vendor lock-in |
| **Cohere multilingual** | Good Hindi support | Less mature ecosystem |
| **Self-hosted (sentence-transformers)** | Cost control | Infra complexity, lower quality |

**Decision:** Start with OpenAI, evaluate Cohere for Hindi optimization.

---

## 🏢 Multi-Tenant SaaS Considerations

### Data Isolation Checklist

- [x] Every query includes `organization_id` (implemented in agent.repository.ts)
- [ ] RLS policies on all tenant tables (needs DB setup)
- [ ] Audit logging for cross-tenant access
- [ ] Separate encryption keys per org (future)

### Resource Isolation

```typescript
// Rate limiting per organization
const limiter = new RateLimiter({
  keyPrefix: `org:${orgId}:api`,
  points: plan.apiLimit,
  duration: 60,
});

// Usage quotas per organization
const usage = await getMonthlyUsage(orgId);
if (usage.minutes > plan.minutesLimit) {
  throw new QuotaExceededError();
}
```

### Tenant Onboarding Flow

1. User signs up → Clerk creates user
2. User creates organization → Clerk org
3. System provisions:
   - Default agent templates
   - Initial knowledge base
   - Webhook endpoints
   - Usage tracking

---

## 🎙️ Voice Infrastructure Analysis

### Latency Budget

```
Target end-to-end: < 2 seconds

┌─────────────────────────────────────────────────────┐
│  STT        │  Processing  │  LLM      │  TTS      │
│  300ms      │  100ms       │  800ms    │  400ms    │
│  (streaming)│              │  (opt)    │  (stream) │
└─────────────────────────────────────────────────────┘
         Total: ~1600ms (within budget)
```

### Provider Evaluation Matrix (India)

| Provider | STT Quality | TTS Quality | Hindi | Latency | Cost |
|----------|-------------|-------------|-------|---------|------|
| Azure    | ★★★★☆      | ★★★★☆      | ✅    | Medium  | $$$  |
| Google   | ★★★★★      | ★★★★☆      | ✅    | Medium  | $$$  |
| Deepgram | ★★★★★      | N/A        | ⚠️    | Low     | $$   |
| AWS      | ★★★☆☆      | ★★★☆☆      | ✅    | Medium  | $$   |
| Bhashini | ★★★☆☆      | ★★★☆☆      | ✅    | High    | Free |

### Telephony Provider Comparison (India)

| Provider | India Numbers | IVR Support | Pricing | SDK Quality |
|----------|---------------|-------------|---------|-------------|
| Twilio   | ✅            | ★★★★★      | $$$     | ★★★★★      |
| Exotel   | ✅            | ★★★★☆      | $$      | ★★★☆☆      |
| Plivo    | ✅            | ★★★★☆      | $$      | ★★★★☆      |
| Knowlarity| ✅           | ★★★☆☆      | $       | ★★☆☆☆      |

---

## ❓ Unknowns Requiring Validation

### Must Validate Before MVP

1. **Clerk Organization Limits**
   - What's the max users per org on free/starter?
   - How does org switching work in mobile?

2. **Neon Connection Behavior**
   - Cold start latency in practice?
   - Connection pooling with serverless?

3. **React Flow Bundle Size**
   - Impact on initial page load?
   - Tree-shaking effectiveness?

4. **Hindi STT Accuracy**
   - Real-world accuracy with Indian accents?
   - Code-switching (Hindi + English) handling?

### Validate Before Scale

1. **WhatsApp Business API Approval**
   - Timeline for approval?
   - Template restrictions for voice?

2. **Telephony Regulations**
   - TRAI compliance requirements?
   - DND registry integration?

3. **Data Localization**
   - DPDPA requirements for voice data?
   - Storage location constraints?

---

## 🇮🇳 India-First Constraints

### Network Realities

- Variable 4G quality outside metros
- High latency spikes during peak hours
- Need for graceful degradation
- Offline-first considerations for dashboard

### Language Support Priority

1. **Phase 1:** English, Hindi
2. **Phase 2:** Tamil, Telugu, Kannada
3. **Phase 3:** Bengali, Marathi, Gujarati

### Cost Sensitivity

- SMBs have limited budgets
- Per-minute pricing must be competitive
- Free tier essential for adoption
- UPI/Razorpay essential (not just Stripe)

### Compliance

- **DPDPA (2023):** Data protection requirements
- **TRAI:** Telecom regulations for calls
- **Industry-specific:** Healthcare data for clinics

---

## 🛠️ Phase 0 Implementation Findings

### New Technical Findings During Implementation

1. **Express v5 Type Changes:** `req.params` values are `string | string[]` in `@types/express@5`. Required explicit casting `req.params.id as string` for route params.

2. **pnpm + TS Declaration Emit:** Using `declaration: true` in apps (not libraries) causes TS2742 errors because TypeScript tries to reference pnpm's nested `node_modules` structure in declaration files. **Fix:** Disable `declaration` and `declarationMap` in app-level `tsconfig.json`, only enable in packages that need to be consumed as compiled libraries.

3. **Clerk SSG Compatibility:** Clerk components (`OrganizationSwitcher`, `UserButton`) fail during Next.js static generation because they require `ClerkProvider` context. **Fix:** Use `export const dynamic = 'force-dynamic'` on layouts/pages that use Clerk components. Also, made `ClerkProvider` conditional on `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` being set so builds work without credentials.

4. **Tailwind CSS v4:** Uses `@import "tailwindcss"` instead of v3's `@tailwind` directives. Theme customization uses `@theme` block instead of `tailwind.config.ts`. No separate config file needed.

5. **Next.js 15 + React 19:** No issues encountered. The new React 19 types work seamlessly with Next.js 15 server/client components.

---

## 📊 Summary of Critical Decisions

| Area | Decision | Confidence | Validated |
|------|----------|------------|-----------|
| Architecture | Modular Monolith | High | ✅ |
| Database | Shared PostgreSQL + RLS | High | ✅ Schema created |
| Auth | Clerk + Custom RBAC | High | ✅ Middleware built |
| Voice Providers | Abstraction layer | High | ⬜ Phase 1 |
| Vector Store | pgvector → Pinecone | Medium | ⬜ Phase 1 |
| Job Queue | BullMQ + Redis | High | ⬜ Phase 1 |
| Voice Runtime | Separable module | High | ⬜ Phase 1 |
| Telephony | Exotel/Plivo primary | Medium | ⬜ Phase 2 |
| TTS | Azure primary, Bhashini secondary | Medium | ⬜ Phase 1 |
