# AXION HQ — App Empresarial

Escritorio del CEO: empresa, finanzas, YouTube y el sistema operativo en construcción.

Dashboard para construir y gestionar una empresa (orientado a Argentina: SAS, CUIT, etc.).

## Stack

- TanStack Start / React Router
- React 19 + Tailwind CSS 4
- Zustand, Recharts
- Vite

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | HQ / briefing |
| `/tareas` | Tablero P0–P3 |
| `/empresa` | Estado legal y gaps |
| `/finanzas` | Ingresos, gastos, wealth |
| `/youtube` | Hitos y pilares del canal |
| `/os` | Módulos del sistema operativo |
| `/ceo` | Cadencia y rate card |

## Cómo correr

```bash
git clone https://github.com/alexironmanreal-ai/app-empresarial.git
cd app-empresarial
npm install
npm run dev
```

Abrí http://localhost:8080

## Notas

- El progreso de tareas se guarda en `localStorage` (Zustand persist).
- En Ajustes podés cambiar founder, empresa, moneda (USD/ARS) y reiniciar.
- Versión adaptada para correr fuera del entorno Grok App Builder.
