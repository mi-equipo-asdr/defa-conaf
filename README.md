# defa-conaf

Balance Presupuestario Mensual CONAF · automatización del flujo SIGFE.

Monorepo con dos paquetes:

```
defa-conaf/
├── api/              Parser SIGFE (Next.js)
├── ui/               Interfaz visual (Next.js + React + Shadcn + Supabase)
├── blcemensual/      Datos CONAF reales · gitignored
└── README.md
```

## `/api` · parser SIGFE

Next.js. Lee los reportes del Sistema de Información para la Gestión Financiera del Estado (SIGFE) y los transforma en estructura procesable.

```bash
cd api
npm install
npm run dev   # http://localhost:3000
```

## `/ui` · interfaz visual

Next.js 16 + React 19 + Shadcn UI + Supabase. UI de exploración y exportación de balances (SPA client-only montada en un catch-all del App Router).

```bash
cd ui
npm install
npm run dev   # http://localhost:8080
```

Requiere `ui/.env` con credenciales Supabase (ver `ui/.env.example` si existe, o configurar manualmente).

## `/blcemensual` · datos institucionales

Carpeta con XLS, DOCX y previews del Balance Presupuestario. **No va al repo** (gitignored) por contener datos institucionales sensibles.

Para correr el parser con datos reales, descarga los XLS desde SIGFE y colócalos acá.

## Stack

- **Backend / parser**: Next.js, TypeScript
- **Frontend / UI**: Next.js 16, React 19, Shadcn UI, Tailwind, Supabase
- **Testing UI**: Playwright + Vitest
- **Lenguaje**: TypeScript en todo

## Despliegue

- `/api` se despliega como Next.js app (Vercel o Cloudflare).
- `/ui` se despliega como export estático de Next.js (`next build` genera `out/`); en Vercel u otro hosting estático necesita fallback SPA para rutas client-side.
- La data nunca sale del entorno local. SIGFE no expone API pública, se trabaja con descargas manuales.

## Autora

Amparo Donoso Rodríguez · Abogada Provincial OP Ranco · CONAF Los Ríos · 2026
