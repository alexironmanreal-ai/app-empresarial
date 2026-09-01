# AXION HQ — App Empresarial

Escritorio del CEO: empresa, finanzas, YouTube y el sistema operativo en construcción.

Dashboard para construir y gestionar una empresa (orientado a Argentina: SAS, CUIT, etc.).

## Qué cambió (nivel realidad)

Esta versión deja de ser solo checklist motivacional y pasa a medir **supervivencia**:

- **Runway real** (días de caja) calculado a partir de saldos + burn estimado
- **Burn mensual** (gastos recurrentes + override editable)
- **Review semanal forzada** — el briefing grita si llevás >7 días sin cerrar review
- **HQ con números duros**: caja, runway, P0 abiertos, días desde última review
- **Briefing contextual** según caja, runway y estado de review (no textos genéricos)
- Persistencia actualizada a `axion-hq-v4`

## Stack

- TanStack Start / React Router
- React 19 + Tailwind CSS 4
- Zustand, Recharts
- Vite

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | HQ / briefing + realidad (caja, runway, review) |
| `/tareas` | Tablero P0–P3 |
| `/tracker` | 365 días de cadencia |
| `/empresa` | Estado legal y gaps |
| `/finanzas` | Caja, runway, burn, wealth |
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

- El progreso de tareas se guarda en `localStorage` (Zustand persist · key `axion-hq-v4`).
- En Ajustes podés cambiar founder, empresa, moneda (USD/ARS) y reiniciar.
- En Finanzas cargá saldos reales y el burn extra (comida, tools, etc.).
- En HQ usá **Cerrar review semanal** cada viernes (o cuando corresponda).
- Versión adaptada para correr fuera del entorno Grok App Builder.
