#!/usr/bin/env bash
# =============================================================================
# Sentinel HQ — instalador para Ubuntu / Debian / Linux en general
#
# Uso (desde la raíz del repo):
#   ./scripts/install-linux.sh              # instala (auto: .deb o AppImage)
#   ./scripts/install-linux.sh --appimage   # fuerza AppImage (sin root)
#   ./scripts/install-linux.sh --deb        # fuerza .deb (Ubuntu/Debian)
#   ./scripts/install-linux.sh --uninstall  # desinstala
#
# NO modifica ningún archivo del proyecto: solo compila con los scripts que ya
# existen (npm run dist:linux) e instala el resultado.
# =============================================================================
set -euo pipefail

APP_NAME="Sentinel HQ"
APP_ID="sentinel-hq"
MODE="auto"

# --- colores / helpers -------------------------------------------------------
if [ -t 1 ]; then B=$'\e[1m'; G=$'\e[32m'; Y=$'\e[33m'; R=$'\e[31m'; N=$'\e[0m'; else B=""; G=""; Y=""; R=""; N=""; fi
info() { echo "${B}${G}==>${N} $*"; }
warn() { echo "${B}${Y}[!]${N} $*" >&2; }
die()  { echo "${B}${R}[x]${N} $*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }

SUDO=""
if [ "$(id -u)" -ne 0 ]; then
  have sudo && SUDO="sudo"
fi
need_root() { [ -z "$SUDO" ] && [ "$(id -u)" -ne 0 ] && die "Se necesita root o sudo para: $*"; return 0; }

# --- rutas -------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

OPT_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/$APP_ID"
BIN_DIR="$HOME/.local/bin"
APPS_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/applications"
ICON_DIR="${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor/512x512/apps"

# --- argumentos --------------------------------------------------------------
for arg in "$@"; do
  case "$arg" in
    --appimage)  MODE="appimage" ;;
    --deb)       MODE="deb" ;;
    --uninstall) MODE="uninstall" ;;
    -h|--help)   sed -n '2,13p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) die "Opción desconocida: $arg (usá --help)" ;;
  esac
done

# --- desinstalar -------------------------------------------------------------
uninstall() {
  info "Desinstalando $APP_NAME…"
  if have dpkg && dpkg -s "$APP_ID" >/dev/null 2>&1; then
    need_root "desinstalar el paquete .deb"
    $SUDO apt-get remove -y "$APP_ID" || $SUDO dpkg -r "$APP_ID"
  fi
  rm -rf "$OPT_DIR"
  rm -f "$BIN_DIR/$APP_ID" "$APPS_DIR/$APP_ID.desktop" "$ICON_DIR/$APP_ID.png"
  have update-desktop-database && update-desktop-database "$APPS_DIR" >/dev/null 2>&1 || true
  info "Listo. (Tus datos en Supabase y la config local de la app no se tocan.)"
}
if [ "$MODE" = "uninstall" ]; then uninstall; exit 0; fi

# --- sanity checks -----------------------------------------------------------
[ "$(uname -s)" = "Linux" ] || die "Este instalador es solo para Linux."
case "$(uname -m)" in
  x86_64|amd64) ;;
  *) die "Arquitectura $(uname -m) no soportada: el empaquetado del proyecto es x64." ;;
esac
[ -f "$REPO_DIR/package.json" ] || die "No encuentro package.json en $REPO_DIR. Ejecutá el script desde el repo."
cd "$REPO_DIR"

# --- gestor de paquetes ------------------------------------------------------
PM=""
for p in apt-get dnf pacman zypper; do have "$p" && { PM="$p"; break; }; done

pm_install() {
  need_root "instalar dependencias del sistema ($*)"
  case "$PM" in
    apt-get) $SUDO apt-get update -y && $SUDO apt-get install -y "$@" ;;
    dnf)     $SUDO dnf install -y "$@" ;;
    pacman)  $SUDO pacman -S --noconfirm --needed "$@" ;;
    zypper)  $SUDO zypper --non-interactive install "$@" ;;
    *) die "No reconozco tu gestor de paquetes. Instalá manualmente: $*" ;;
  esac
}

# --- Node.js >= 18 -----------------------------------------------------------
node_ok() {
  have node && have npm || return 1
  local major; major="$(node -v | sed 's/^v//; s/\..*//')"
  [ "${major:-0}" -ge 18 ]
}

if ! node_ok; then
  warn "Node.js 18+ no encontrado. Instalando…"
  case "$PM" in
    apt-get)
      pm_install ca-certificates curl gnupg
      curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO -E bash -
      pm_install nodejs ;;
    dnf)    pm_install nodejs npm ;;
    pacman) pm_install nodejs npm ;;
    zypper) pm_install nodejs20 npm20 || pm_install nodejs npm ;;
    *)      die "Instalá Node.js 18+ (recomendado 20 LTS) y volvé a correr el script." ;;
  esac
  node_ok || die "No se pudo dejar Node.js 18+ operativo."
fi
info "Node $(node -v) / npm $(npm -v)"

# Herramientas que electron-builder necesita para armar .deb / AppImage
if [ "$PM" = "apt-get" ]; then
  for t in dpkg-deb fakeroot; do
    have "$t" || { info "Instalando dependencia de empaquetado: $t"; pm_install dpkg fakeroot; break; }
  done
fi

# --- configuración Supabase (.env se hornea en el build) ---------------------
if [ ! -f "$REPO_DIR/.env" ]; then
  warn "No existe .env: la app quedará en modo SOLO LOCAL (sin sincronización Supabase)."
  warn "Si querés la nube: cp .env.example .env, completalo y volvé a correr este script."
  if [ -t 0 ]; then
    read -r -p "¿Continuar igual en modo local? [S/n] " ans
    case "${ans:-S}" in n|N) die "Cancelado. Creá el .env y reintentá." ;; esac
  fi
else
  info "Usando .env existente (Supabase se incluirá en el build)."
fi

# --- dependencias + build ----------------------------------------------------
info "Instalando dependencias npm…"
if [ -f package-lock.json ]; then npm ci || npm install; else npm install; fi

info "Compilando instaladores Linux (puede tardar unos minutos)…"
rm -rf "$REPO_DIR/release"
if [ "$MODE" = "appimage" ]; then
  npm run build && npx electron-builder --linux AppImage
elif [ "$MODE" = "deb" ]; then
  npm run build && npx electron-builder --linux deb
else
  npm run dist:linux
fi

DEB_FILE="$(find "$REPO_DIR/release" -maxdepth 1 -type f -name '*.deb' | head -n1 || true)"
APPIMAGE_FILE="$(find "$REPO_DIR/release" -maxdepth 1 -type f -name '*.AppImage' | head -n1 || true)"

# --- elegir método -----------------------------------------------------------
if [ "$MODE" = "auto" ]; then
  if have dpkg && [ -n "$DEB_FILE" ]; then MODE="deb"; else MODE="appimage"; fi
fi

install_deb() {
  [ -n "$DEB_FILE" ] || die "No se generó el .deb."
  need_root "instalar el .deb"
  info "Instalando $(basename "$DEB_FILE")…"
  $SUDO apt-get install -y "$DEB_FILE" || { $SUDO dpkg -i "$DEB_FILE" && $SUDO apt-get -f install -y; }
  info "Instalado como paquete del sistema. Buscá \"$APP_NAME\" en el menú de aplicaciones."
}

install_appimage() {
  [ -n "$APPIMAGE_FILE" ] || die "No se generó el AppImage."
  info "Instalando AppImage en $OPT_DIR…"
  mkdir -p "$OPT_DIR" "$BIN_DIR" "$APPS_DIR" "$ICON_DIR"
  install -m 0755 "$APPIMAGE_FILE" "$OPT_DIR/$APP_ID.AppImage"
  [ -f "$REPO_DIR/build/icon.png" ] && install -m 0644 "$REPO_DIR/build/icon.png" "$ICON_DIR/$APP_ID.png"

  # Launcher: resuelve dos problemas típicos en Ubuntu moderno
  #  - 22.04+ sin libfuse2  -> --appimage-extract-and-run
  #  - 24.04+ AppArmor bloquea el sandbox de Chromium -> --no-sandbox
  cat > "$BIN_DIR/$APP_ID" <<EOF
#!/usr/bin/env bash
APPIMAGE="$OPT_DIR/$APP_ID.AppImage"
ARGS=()
if ! ldconfig -p 2>/dev/null | grep -q 'libfuse.so.2'; then
  export APPIMAGE_EXTRACT_AND_RUN=1
fi
if [ "\$(cat /proc/sys/kernel/apparmor_restrict_unprivileged_userns 2>/dev/null || echo 0)" = "1" ] \\
   || [ "\$(cat /proc/sys/kernel/unprivileged_userns_clone 2>/dev/null || echo 1)" = "0" ]; then
  ARGS+=(--no-sandbox)
fi
exec "\$APPIMAGE" "\${ARGS[@]}" "\$@"
EOF
  chmod 0755 "$BIN_DIR/$APP_ID"

  cat > "$APPS_DIR/$APP_ID.desktop" <<EOF
[Desktop Entry]
Name=$APP_NAME
Comment=Escritorio del CEO
Exec=$BIN_DIR/$APP_ID %U
Icon=$ICON_DIR/$APP_ID.png
Terminal=false
Type=Application
Categories=Office;Finance;
StartupWMClass=$APP_NAME
EOF
  have update-desktop-database && update-desktop-database "$APPS_DIR" >/dev/null 2>&1 || true
  have gtk-update-icon-cache && gtk-update-icon-cache -q "${XDG_DATA_HOME:-$HOME/.local/share}/icons/hicolor" >/dev/null 2>&1 || true

  info "Instalado para tu usuario. Buscá \"$APP_NAME\" en el menú o ejecutá: $APP_ID"
  case ":$PATH:" in *":$BIN_DIR:"*) ;; *) warn "Agregá $BIN_DIR a tu PATH para usar el comando '$APP_ID' en terminal." ;; esac
}

case "$MODE" in
  deb)      install_deb ;;
  appimage) install_appimage ;;
  *)        die "Modo inválido: $MODE" ;;
esac

info "¡Listo! Para desinstalar: ./scripts/install-linux.sh --uninstall"
