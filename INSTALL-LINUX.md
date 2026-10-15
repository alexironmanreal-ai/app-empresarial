# Instalar Sentinel HQ en Ubuntu / Linux

## Un comando

```bash
git clone https://github.com/alexironmanreal-ai/app-empresarial.git
cd app-empresarial
cp .env.example .env      # completar con tu Supabase (opcional: sin esto queda en modo local)
./scripts/install-linux.sh
```

El script: instala Node 20 si falta → `npm install` → compila (`npm run dist:linux`) → instala.

| Opción | Efecto |
|---|---|
| *(sin opción)* | Ubuntu/Debian → instala el **.deb** (menú de apps, sistema). Otros Linux → **AppImage** |
| `--appimage` | AppImage en `~/.local/share/sentinel-hq` (no requiere root, funciona en cualquier distro) |
| `--deb` | Fuerza .deb |
| `--uninstall` | Desinstala (no toca tus datos de Supabase) |

Luego buscá **Sentinel HQ** en el menú de aplicaciones, o ejecutá `sentinel-hq` en terminal (AppImage).

## Notas

- El `.env` se incluye **al compilar**: si lo cambiás, volvé a correr el instalador.
- Ubuntu 22.04+ sin `libfuse2` y Ubuntu 24.04 (AppArmor/sandbox) están contemplados en el launcher del AppImage.
- Solo x64.
- Este instalador no modifica código de la app; solo usa los scripts existentes de `package.json`.
