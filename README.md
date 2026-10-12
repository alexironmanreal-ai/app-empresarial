# SENTINEL HQ — App Empresarial

Escritorio del CEO: empresa, finanzas, YouTube, pipeline, OS y cadencia.

**v1.1** — Cuentas locales multi-usuario: cada cuenta guarda su propio progreso, caja, leads y tokens API en este dispositivo.

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

## Cuentas locales (persistencia por usuario)

Al abrir la app verás **Entrar** o **Crear cuenta local**.

- Usuario + contraseña (hash SHA-256, solo en este equipo).
- Cada cuenta tiene su propio almacenamiento: tareas, finanzas, pipeline, YouTube, GitHub, onboarding.
- Cerrar sesión vuelve a la pantalla de login; otra cuenta no ve los datos de la anterior.
- “Reiniciar progreso” en Ajustes solo borra los datos de la cuenta actual.

No hay servidor de autenticación: todo vive en `localStorage` del perfil de Electron / del navegador.

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

## Instaladores

### Linux · AppImage + .deb

```bash
npm install
npm run dist:linux
# equivalente: npm run electron:installer:linux
```

Salida en `release/`:

| Archivo | Uso |
|---------|-----|
| **Sentinel HQ-1.1.0-x64.AppImage** | Portable: Ubuntu, Fedora, Arch, openSUSE, etc. Sin instalar. |
| **Sentinel HQ-1.1.0-x64.deb** | Instalador nativo Debian/Ubuntu (Mint, Pop!_OS, …) |

#### AppImage

```bash
chmod +x "release/Sentinel HQ-1.1.0-x64.AppImage"
./"release/Sentinel HQ-1.1.0-x64.AppImage"
```

#### .deb (Ubuntu / Debian)

```bash
sudo dpkg -i "release/Sentinel HQ-1.1.0-x64.deb"
sudo apt-get install -f   # si faltan dependencias
```

Desinstalar: `sudo apt remove sentinel-hq`

> Conviene compilar Linux **en Linux**.

### Windows · .exe (instalador + portable)

```bash
npm install
npm run dist:win
# o solo NSIS: npm run electron:build
```

Salida en `release/`:

- **Sentinel HQ-Setup-1.1.0.exe** — instalador NSIS
- **Sentinel HQ-Portable-1.1.0.exe** — portable (sin instalar)

> El build del `.exe` conviene hacerlo **en Windows**.

### Todo (Windows + Linux)

```bash
npm run dist:all
```

---

## Qué incluye el empaquetado

- Toda la UI (HQ, tareas, tracker, registros, pipeline, YT, OS, CEO)
- Proxy local para YouTube / Mercado Pago / GitHub (`/api/...`)
- Cuentas locales multi-usuario con datos aislados por cuenta
- Persistencia en el perfil de Electron / localStorage

## Notas

- Progreso en `localStorage` (Zustand), clave por `userId`.
- YouTube: API key + handle en el módulo.
- Pipeline: leads hasta cobrado.
- OS: repo GitHub + commits.
- Registros: export CSV.
