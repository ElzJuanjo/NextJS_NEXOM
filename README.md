# NexOS Frontend — Next.js 14

Frontend completo para la plataforma **FastAPI-NexOS** de automatización e-commerce con IA.

## Stack

- **Next.js 14** (App Router, Route Groups, Server Components)
- **TypeScript** strict mode
- **Tailwind CSS** con design tokens HSL (dark/light)
- **TanStack Query v5** para state management + cache
- **Anime.js** para micro-interacciones
- **Axios** con interceptors para 401/404
- **React Hook Form + Zod** para validación
- **react-hot-toast** para notificaciones

## Arquitectura

```
src/
├── app/                     # Next.js App Router
│   ├── (auth)/              # Grupo público: login, register, verify, etc
│   ├── (dashboard)/         # Grupo protegido: sidebar + header
│   │   ├── dashboard/       # Vista principal
│   │   ├── orchestrator/    # Chat con IA multi-agente
│   │   ├── branding/        # CRUD de marcas
│   │   ├── products/        # CRUD de productos
│   │   ├── creative/        # Gestión de creativos
│   │   ├── copywriting/     # Generación de copy
│   │   ├── landing/         # Landing pages
│   │   ├── conversion/      # Optimización
│   │   ├── flows/           # Flujos + templates
│   │   └── settings/        # Configuración
├── lib/                     # Utilidades core
│   ├── api-client.ts        # Axios + interceptors (401 refresh, 404 graceful)
│   ├── auth.ts              # Cookie helpers (access token en cookie JS-readable)
│   ├── query-client.ts      # TanStack Query config
│   └── utils.ts             # cn(), formatters
├── services/                # Capa de servicios (1:1 con backend)
├── hooks/                   # TanStack Query custom hooks
├── components/              # UI components reutilizables
│   ├── ui/                  # Primitivos: Modal, Spinner, Skeleton, StatusBadge
│   ├── layout/              # Sidebar, Header, CreateOrgModal
│   ├── dashboard/           # StatsCard, CreditUsage
│   ├── empty-states/        # EmptyState (para 404 amigables)
│   └── providers/           # QueryProvider, ThemeProvider, Toaster
└── types/                   # TypeScript types (mirror de DTOs backend)
```

## Seguridad

- **Refresh token**: cookie httpOnly (seteada por el backend, invisible para JS)
- **Access token**: almacenado en cookie JS-readable + memoria (módulo-level variable)
- **middleware.ts**: protección de rutas server-side
- **Interceptor 401**: refresh silencioso con cola de requests fallidos
- **XSS prevention**: sanitización de HTML dinámico con DOMPurify
- **Input validation**: Zod schemas en todos los formularios

## Decisiones de Diseño

### 404 → Empty States
Los errores 404 (usuarios nuevos sin datos) se tratan como empty states amigables, no como errores críticos. Cada página muestra un `<EmptyState>` con CTA para crear el primer recurso.

### TanStack Query vs Zustand
Se reemplazó Zustand por TanStack Query porque:
- Cache automático con stale-while-revalidate
- Invalidación granular por query key
- Optimistic updates built-in
- Zero prop drilling
- DevTools incluidas

### Anime.js vs Framer Motion
- Anime.js es más liviano (~16KB vs ~32KB)
- Custom hooks `useFadeIn`, `useStagger`, `useAnime` encapsulan la lógica
- CSS animations para estados simples (fade-in, shimmer)

## Setup

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables
cp .env.example .env.local

# 3. Asegurar que el backend esté corriendo en localhost:8000

# 4. Desarrollo
npm run dev
```

## Endpoints Backend Consumidos

| Módulo | Endpoints |
|--------|-----------|
| Auth | register, login, refresh, logout, me, verify-email, resend-verification, google/login, google/callback, me/referral |
| Organizations | POST, GET /me, PATCH /me, PATCH /me/plan, GET /me/usage, GET list |
| Plans | GET list |
| Brands | CRUD (POST, GET, PATCH, DELETE) |
| Products | CRUD (POST, GET, PATCH, DELETE) |
| Agents | GET /available, POST /execute, GET /agent-tasks |
| Flows | CRUD + POST /execute, CRUD steps |
| Flow Templates | GET list, POST create from template |
| Creatives | CRUD |
| Creative Batches | GET /presets, POST generate |
| Landing Pages | CRUD + PATCH sections |
| Orchestrator | POST (main AI entry point) |
