# AXION HQ — App Empresarial

Escritorio del CEO: empresa, finanzas, YouTube y el sistema operativo en construcción.

Dashboard para construir y gestionar una empresa (orientado a Argentina: SAS, CUIT, etc.).

## Stack

- TanStack Start / React Router
- React 19 + Tailwind CSS 4
- Zustand, Recharts, better-auth, PGlite
- Vite

## Rutas principales

- `/` — Home / briefing
- `/tareas` — Tablero de tareas (P0/P1)
- `/finanzas` — Ingresos, gastos, proyección de wealth
- `/ceo` — Vista CEO
- `/empresa` — Estado de la empresa
- `/os` — Módulos del sistema operativo
- `/youtube` — Hitos de contenido

## Desarrollo

```bash
npm install
npm run dev
```

La app espera el entorno de App Builder de Grok (auth gates, preview bridge). Para uso standalone puede requerir ajustes en `src/lib/auth` y scripts de entorno.

## Origen

Generada y refinada en el workspace de Grok App Builder.
