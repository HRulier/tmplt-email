# template-email-gen

Générateur de templates email propulsé par l'IA. Décrivez votre email en langage naturel, éditez les champs directement ou via le chat.

---

## Fonctionnalités

- **Génération par chat** — décrivez votre email à Claude, il génère le code React Email en temps réel
- **Prévisualisation live** — rendu HTML de l'email dans un iframe, mis à jour à chaque modification
- **Champs éditables** — les zones de texte sont extraites automatiquement et éditables depuis le panneau latéral
- **Thème de marque** — couleurs, police, logo et lien de désabonnement injectés dans le contexte IA
- **Templates d'exemple** — un template de bienvenue est copié sur chaque nouveau compte au moment de l'inscription
- **Envoi de test** — envoi de l'email directement depuis l'éditeur via Resend
- **Clé API personnelle** — les utilisateurs peuvent brancher leur propre clé Anthropic (quota illimité) ; sinon 5 requêtes gratuites sur la clé serveur
- **Authentification** — inscription / connexion / réinitialisation de mot de passe

## Stack technique

| Couche          | Technologie                                      |
| --------------- | ------------------------------------------------ |
| Framework       | Next.js 16 (App Router)                          |
| UI              | React 19, CSS Modules                            |
| IA              | Vercel AI SDK v6 + Anthropic Claude              |
| Email           | @react-email/components, compilation via esbuild |
| Auth            | better-auth v1.6                                 |
| Base de données | MongoDB + Mongoose 9                             |
| Envoi email     | Resend                                           |

## Structure du projet

```
projet/
└── src/
    ├── app/
    │   ├── (auth)/          # sign-in, sign-up, reset-password
    │   ├── (dashboard)/
    │   │   ├── dashboard/   # liste des templates
    │   │   ├── generate/    # éditeur IA (page principale)
    │   │   ├── profile/     # clé API utilisateur
    │   │   └── theme/       # thème de marque
    │   └── api/             # chat streaming, preview, templates, send-test
    ├── components/
    │   ├── generate/        # ChatPanel, Workspace, FieldEditorSidebar, EmailPreviewFrame
    │   └── layout/          # Header
    ├── contexts/            # TemplateContext (VFS, messages, fields)
    └── lib/
        ├── models/          # Template, UserSettings, Theme (Mongoose)
        ├── tools/           # outils Claude (extract-fields, str-replace, file-manager…)
        ├── prompts/         # system prompt de génération email
        └── vfs-compiler.ts  # compilation Email.tsx en mémoire via esbuild
```

## Installation

### Prérequis

- Node.js 20+
- MongoDB (local ou Atlas)
- Compte [Resend](https://resend.com) pour l'envoi d'emails
- Clé API [Anthropic](https://console.anthropic.com)

### Variables d'environnement

Créez un fichier `projet/.env.local` à partir de l'exemple ci-dessous :

```env
MONGODB_URI=mongodb://localhost:27017/template-email-gen

BETTER_AUTH_SECRET=        # clé aléatoire (min. 32 chars)
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3000

RESEND_API_KEY=            # re_xxxxx
RESEND_FROM_EMAIL=noreply@votre-domaine.com

ANTHROPIC_API_KEY=         # sk-ant-xxxxx
API_KEY_ENCRYPTION_SECRET= # 64 caractères hexadécimaux (32 octets)
```

Pour générer `API_KEY_ENCRYPTION_SECRET` :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Démarrage

```bash
cd projet
npm install
npm run dev
```

L'application est accessible sur [http://localhost:3000](http://localhost:3000).

### Seed des templates d'exemple (optionnel)

```bash
npm run seed:examples
```

Insère le template "Email de bienvenue" dans MongoDB. Il sera automatiquement copié sur chaque nouveau compte créé.

## Licence

Ce projet est publié publiquement à titre de démonstration.
