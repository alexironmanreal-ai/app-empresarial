# SENTINEL HQ — App Empresarial

Escritorio del CEO: empresa, finanzas, YouTube, pipeline, OS y cadencia.

## Web (desarrollo)

```bash
npm install
npm run dev
```

Abrí http://localhost:8080

## Windows · .exe

```bash
npm install
npm run electron:build
```

Salida en `release/`:

- **Sentinel HQ-1.0.0-nsis.exe** — instalador
- **SentinelHQ-Portable-1.0.0.exe** — portable (sin instalar)

Probar en ventana Electron sin empaquetar:

```bash
npm run electron:dev
```

> El build del `.exe` conviene hacerlo **en Windows**. En otra OS puede fallar el target `win`.

## Qué incluye el exe

- Toda la UI (HQ, tareas, tracker, registros, pipeline, YT, OS, CEO)
- Proxy local para YouTube / Mercado Pago / GitHub (mismas rutas `/api/...`)
- Datos en localStorage del perfil de Electron (se mantienen entre sesiones)

## Notas

- Progreso en `localStorage` (Zustand).
- YouTube: API key + handle en la pantalla del módulo.
- Pipeline: leads hasta cobrado.
- OS: repo GitHub + commits.
- Registros: export CSV.
