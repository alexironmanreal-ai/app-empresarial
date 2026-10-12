# SENTINEL HQ — App Empresarial

Escritorio del CEO: empresa, finanzas, YouTube, pipeline, OS y cadencia.

## Requisitos

- **Node.js** 18+ (recomendado 20 LTS)
- **npm** (viene con Node)

### Instalar Node en Ubuntu / Debian

```bash
# Opción rápida (NodeSource 20.x)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar
node -v   # v20.x
npm -v
```

En otras distros: usa el gestor de paquetes (`dnf`, `pacman`, `zypper`) o [nvm](https://github.com/nvm-sh/nvm).

---

## Web (desarrollo)

```bash
git clone https://github.com/alexironmanreal-ai/app-empresarial.git
cd app-empresarial
npm install
npm run dev
```

Abrí http://localhost:8080

Probar en ventana Electron sin empaquetar:

```bash
npm run electron:dev
```

---

## Linux · AppImage + .deb (Ubuntu y cualquier distro)

```bash
npm install
npm run electron:build:linux
# o solo instaladores:
npm run electron:installer:linux
```

Salida en `release/`:

| Archivo | Uso |
|---------|-----|
| **Sentinel HQ-1.0.0-x64.AppImage** | Portable: funciona en Ubuntu, Fedora, Arch, openSUSE, etc. Sin instalar. |
| **Sentinel HQ-1.0.0-x64.deb** | Instalador nativo para Debian/Ubuntu (y derivados: Mint, Pop!_OS, etc.) |

### Usar el AppImage (cualquier distro)

```bash
chmod +x "release/Sentinel HQ-1.0.0-x64.AppImage"
./"release/Sentinel HQ-1.0.0-x64.AppImage"
```

Opcional: mover a `~/Applications` o `/usr/local/bin` y crear un acceso directo en el menú.

### Instalar el .deb (Ubuntu / Debian)

```bash
sudo dpkg -i "release/Sentinel HQ-1.0.0-x64.deb"
# Si faltan dependencias:
sudo apt-get install -f
```

Después aparece **Sentinel HQ** en el menú de aplicaciones.

Desinstalar:

```bash
sudo apt remove sentinel-hq
```

> El build de Linux se puede hacer **en Linux**. En Windows/macOS, electron-builder también puede generar AppImage/deb si tienes las herramientas, pero lo más fiable es compilar en la misma distro (o en Ubuntu).

---

## Windows · .exe

```bash
npm install
npm run electron:build
```

Salida en `release/`:

- **Sentinel HQ-Setup-1.0.0.exe** — instalador NSIS

> El build del `.exe` conviene hacerlo **en Windows**.

---

## Compilar todo (Windows + Linux)

```bash
npm run electron:build:all
```

---

## Qué incluye el empaquetado

- Toda la UI (HQ, tareas, tracker, registros, pipeline, YT, OS, CEO)
- Proxy local para YouTube / Mercado Pago / GitHub (mismas rutas `/api/...`)
- Datos en localStorage del perfil de Electron (se mantienen entre sesiones)

## Notas

- Progreso en `localStorage` (Zustand).
- YouTube: API key + handle en la pantalla del módulo.
- Pipeline: leads hasta cobrado.
- OS: repo GitHub + commits.
- Registros: export CSV.
