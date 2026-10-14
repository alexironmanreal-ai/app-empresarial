# SENTINEL HQ — App Empresarial

Escritorio del CEO: empresa, finanzas, YouTube, pipeline, OS y cadencia.

**v1.2** — Persistencia en la nube con **Supabase (Postgres)** + caché local.

## Persistencia en la nube (Supabase / Postgres) — recomendado

Para que **tareas, caja, leads y registros no se borren** al cerrar sesión ni al cambiar de dispositivo:

### 1. Proyecto Supabase

1. Creá un proyecto en [https://supabase.com](https://supabase.com) (plan free alcanza).
2. **SQL Editor** → New query → pegá y ejecutá el archivo `supabase/schema.sql` del repo.
3. **Authentication → Providers → Email**:
   - Activá Email.
   - Para desarrollo, **desactivá “Confirm email”** (si no, hay que confirmar el mail antes de entrar).
4. **Project Settings → API**: copiá **Project URL** y **anon public** key.

### 2. Variables de entorno

```bash
cp .env.example .env
```

Editá `.env`:

```
VITE_SUPABASE_URL=https://XXXX.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Reiniciá el servidor (`npm run dev`). La pantalla de login pasará a pedir **email + contraseña** y sincronizará el HQ con la tabla `hq_state`.

### 3. Cómo funciona

| Capa | Rol |
|------|-----|
| Supabase Auth | Registro / login (email) |
| Tabla `hq_state` | JSON completo del HQ por `user_id` (RLS: solo vos ves tus filas) |
| localStorage | Caché rápida offline; la nube gana al entrar |

Sin `.env` de Supabase, la app sigue en modo **solo local** (como antes).

---

## Requisitos

- **Node.js** 18+ (recomendado 20 LTS)
- **npm** (viene con Node)

### Instalar Node en Ubuntu / Debian

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v && npm -v
```

---

## Web (desarrollo)

```bash
git clone https://github.com/alexironmanreal-ai/app-empresarial.git
cd app-empresarial
npm install
cp .env.example .env   # completar con Supabase
npm run dev
```

Abrí http://localhost:8080

```bash
npm run electron:dev
```

---

## Instaladores

### Linux · AppImage + .deb

```bash
npm install && npm run dist:linux
```

### Windows · .exe

```bash
npm install && npm run dist:win
```

---

## Notas

- Con Supabase configurado, los datos sobreviven logout y otros dispositivos.
- Tokens de APIs (MP, YT, GH) también van en el JSON de `hq_state` (protegido por RLS).
- Pipeline, registros, caja y tareas se sincronizan unos 600 ms después de cada cambio.
