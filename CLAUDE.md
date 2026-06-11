@AGENTS.md

# EmailGen — Notes pour Claude

## Stack

- **Next.js 16** (App Router) — lire `node_modules/next/dist/docs/` avant d'écrire du code
- **React 19**, TypeScript strict
- **MongoDB + Mongoose 9** — connexion via `src/lib/db.ts` (`connectDB()`)
- **better-auth** — sessions via `auth.api.getSession({ headers: await headers() })`
- **Vercel AI SDK v6** — `streamText`, `useChat`, `createUIMessageStream`
- **@ai-sdk/anthropic v3** — `createAnthropic({ apiKey })` pour les clés par utilisateur
- **@react-email/components** — compilation et preview via VFS + esbuild (`src/lib/vfs-compiler.ts`)
- **Resend** — envoi d'emails de test (`/api/send-test`)
- **react-hook-form + zod** — formulaires côté client
- **CSS Modules** — pas de Tailwind

## Architecture

```
src/
  app/
    (auth)/          — sign-in, sign-up, reset-password
    (dashboard)/
      dashboard/     — liste des templates
      generate/      — éditeur IA (page principale)
      profile/       — clé API utilisateur
    api/
      chat/          — POST streaming IA, GET /usage quota
      preview/       — compilation VFS → HTML iframe
      profile/       — GET/POST clé API, DELETE /api-key
      templates/     — CRUD templates
      send-test/     — envoi email Resend
  components/
    generate/        — ChatPanel, Workspace, EmailPreviewFrame, FieldEditorSidebar, UsageBanner
    layout/          — Header
  contexts/
    TemplateContext  — état partagé (VFS, messages chat, fields)
  lib/
    auth.ts / auth-client.ts
    crypto.ts        — AES-256-GCM (encryptApiKey / decryptApiKey)
    db.ts
    file-system.ts   — VirtualFileSystem (VFS in-memory)
    model-router.ts  — sélection du modèle Anthropic selon le message
    vfs-compiler.ts  — compile Email.tsx via esbuild
    models/
      template.model.ts
      instance.model.ts
      user-settings.model.ts  — encryptedApiKey (select:false), serverKeyUsageCount
    prompts/
      email-generation.ts     — system prompt + règles de génération
    tools/
      extract-fields.ts
      file-manager.ts
      set-template-name.ts
      str-replace.ts
```

## Règles importantes

### Sécurité — clé API utilisateur
- `encryptedApiKey` est toujours `select: false` — utiliser `.select("+encryptedApiKey")` pour la lire
- Déchiffrer uniquement dans le scope de la request, jamais sérialiser ni logger
- `decryptApiKey` / `encryptApiKey` dans `src/lib/crypto.ts` uniquement

### Quota serveur
- Les utilisateurs sans clé perso sont limités à **5 requêtes** sur la clé serveur
- Compteur : `UserSettings.serverKeyUsageCount` (incrémenté via `$inc` avant le stream)
- 429 `{ error: "quota_exceeded" }` si dépassé

### Génération email
- Le VFS tourne en mémoire — l'entrée est toujours `/Email.tsx`
- Les champs éditables ont un `data-field-id` kebab-case
- La largeur max est 600px (instruction dans le system prompt)
- `set_template_name` appelé une seule fois à la génération initiale
- `extract_fields` appelé après chaque génération ou édition

### Patterns Next.js
- Layout dashboard : auth check → `redirect("/sign-in")` si pas de session
- Server components : `await headers()` pour la session
- Client components : `router.refresh()` après mutation pour re-render le server component parent
- Pas de `revalidatePath` dans les route handlers — utiliser `router.refresh()` côté client

## Variables d'environnement requises

```
MONGODB_URI
BETTER_AUTH_SECRET
BETTER_AUTH_URL
NEXT_PUBLIC_BETTER_AUTH_URL
RESEND_API_KEY
RESEND_FROM_EMAIL
ANTHROPIC_API_KEY
API_KEY_ENCRYPTION_SECRET   # 64 hex chars (32 bytes)
```
