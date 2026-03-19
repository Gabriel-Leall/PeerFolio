# PeerFolio

This project was created with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack), a modern TypeScript stack that combines Next.js, Convex, and more.

## Features

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **HeroUI** - Componentes UI principais do projeto ([HeroUI](https://heroui.com/))
- **Shared UI package** - Alternativas usando shadcn/ui na pasta `packages/ui`
- **Convex** - Reactive backend-as-a-service platform
- **Authentication** - Clerk
- **Husky** - Git hooks for code quality
- **Turborepo** - Optimized monorepo build system

## Getting Started

First, install the dependencies:

```bash
bun install
```

## Convex Setup

This project uses Convex as a backend. You'll need to set up Convex before running the app:

```bash
bun run dev:setup
```

Follow the prompts to create a new Convex project and connect it to your application.

Copy environment variables from `packages/backend/.env.local` to `apps/*/.env`.

### Clerk Authentication Setup

- Follow the guide: [Convex + Clerk](https://docs.convex.dev/auth/clerk)
- Set `CLERK_JWT_ISSUER_DOMAIN` in Convex Dashboard
- Set `CLERK_PUBLISHABLE_KEY` in `apps/*/.env`

Then, run the development server:

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
Your app will connect to the Convex cloud backend automatically.

## UI Customization

O foco principal de UI neste projeto é a **HeroUI**. Quando um componente não estiver disponível na HeroUI, utilizamos os componentes shadcn/ui como fallback que são compartilhados via `packages/ui`.

- Use sempre componentes da HeroUI (`@heroui/react`) primeiramente.
- Fallbacks utilizando shadcn/ui ficam em `packages/ui/src/components/*`
- Altere design tokens e estilos em `packages/ui/src/styles/globals.css`
- Ajuste os paths do shadcn ou configurações de estilo em `packages/ui/components.json` e `apps/web/components.json`

### Adicionar mais componentes de fallback

Execute este comando na raiz do projeto para adicionar novas primitivas do shadcn/ui como alternativas:

```bash
npx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Importe os componentes compartilhados assim (referente aos fallbacks com shadcn/ui):

```tsx
import { Button } from "@PeerFolio/ui/components/button";
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Git Hooks and Formatting

- Initialize hooks: `bun run prepare`

## Project Structure

```
PeerFolio/
├── apps/
│   ├── web/         # Frontend application (Next.js)
├── packages/
│   ├── ui/          # Shared shadcn/ui components and styles
│   ├── backend/     # Convex backend functions and schema
│   │   ├── convex/    # Convex functions and schema
│   │   └── .env.local # Convex environment variables
```

## Available Scripts

- `bun run dev`: Start all applications in development mode
- `bun run build`: Build all applications
- `bun run dev:web`: Start only the web application
- `bun run dev:setup`: Setup and configure your Convex project
- `bun run check-types`: Check TypeScript types across all apps
