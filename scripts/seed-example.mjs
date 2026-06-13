/**
 * Seeds one example template into MongoDB.
 * Run once: npm run seed:examples
 *
 * Requires Node 20+ (--env-file flag).
 */

import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI is not set. Did you pass --env-file=.env.local?");
  process.exit(1);
}

// ─── Template code ──────────────────────────────────────────────────────────

const EMAIL_TSX = `\
import {
  Html,
  Head,
  Body,
  Section,
  Text,
  Button,
  Link,
  Hr,
  Preview,
} from "@react-email/components";

export default function Email({
  fieldValues = {},
}: {
  fieldValues?: Record<string, string>;
}) {
  const companyName = fieldValues["company-name"] ?? "Votre marque";
  const heroTitle = fieldValues["hero-title"] ?? "Bienvenue !";
  const heroSubtitle =
    fieldValues["hero-subtitle"] ??
    "Personnalisez ce template via le panneau à droite ou en discutant avec l'IA.";
  const bodyText =
    fieldValues["body-text"] ??
    "Chaque zone de texte de cet email est éditable. Sélectionnez un champ dans le panneau à droite pour le modifier directement, ou demandez à l'IA n'importe quelle modification via le chat.";
  const ctaText = fieldValues["cta-text"] ?? "Commencer maintenant";

  return (
    <Html lang="fr">
      <Head />
      <Preview>{heroTitle}</Preview>
      <Body
        style={{
          backgroundColor: "#f3f4f6",
          fontFamily: "Arial, Helvetica, sans-serif",
          margin: 0,
          padding: "40px 16px",
        }}
      >
        <Section style={{ maxWidth: 600, margin: "0 auto" }}>
          {/* En-tête */}
          <Section
            style={{
              backgroundColor: "#6366f1",
              borderRadius: "12px 12px 0 0",
              padding: "24px 40px",
              textAlign: "center",
            }}
          >
            <Text
              data-field-id="company-name"
              style={{
                color: "#ffffff",
                fontSize: 20,
                fontWeight: 700,
                margin: 0,
                letterSpacing: "-0.01em",
              }}
            >
              {companyName}
            </Text>
          </Section>

          {/* Corps */}
          <Section
            style={{
              backgroundColor: "#ffffff",
              padding: "44px 40px",
              border: "1px solid #e5e7eb",
              borderTop: "none",
            }}
          >
            <Text
              data-field-id="hero-title"
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: "#111827",
                margin: "0 0 12px",
                lineHeight: "1.25",
              }}
            >
              {heroTitle}
            </Text>
            <Text
              data-field-id="hero-subtitle"
              style={{
                fontSize: 17,
                color: "#6b7280",
                margin: "0 0 28px",
                lineHeight: "1.6",
              }}
            >
              {heroSubtitle}
            </Text>
            <Hr style={{ borderColor: "#e5e7eb", margin: "28px 0" }} />
            <Text
              data-field-id="body-text"
              style={{
                fontSize: 15,
                color: "#374151",
                lineHeight: "1.7",
                margin: "0 0 36px",
              }}
            >
              {bodyText}
            </Text>
            <Button
              data-field-id="cta-text"
              href="#"
              style={{
                backgroundColor: "#6366f1",
                color: "#ffffff",
                borderRadius: 8,
                padding: "13px 28px",
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              {ctaText}
            </Button>
          </Section>

          {/* Pied de page */}
          <Section
            style={{
              borderRadius: "0 0 12px 12px",
              border: "1px solid #e5e7eb",
              borderTop: "none",
              backgroundColor: "#f9fafb",
              padding: "20px 40px",
              textAlign: "center",
            }}
          >
            <Text
              style={{ fontSize: 12, color: "#9ca3af", margin: 0, lineHeight: "1.6" }}
            >
              Vous recevez cet email car vous vous êtes inscrit sur {companyName}.{" "}
              <Link href="#" style={{ color: "#9ca3af", textDecoration: "underline" }}>
                Se désabonner
              </Link>
            </Text>
          </Section>
        </Section>
      </Body>
    </Html>
  );
}
`;

// ─── Intro message (copied to new users on register) ─────────────────────────

const INTRO_TEXT =
  "Voici votre premier template ! Il contient 5 champs éditables visibles dans le panneau à droite. " +
  "Essayez de me demander une modification via ce chat — par exemple : " +
  '"Change la couleur du bouton en vert", ' +
  'ou "Ajoute une section avec une image".';

// ─── Seed ────────────────────────────────────────────────────────────────────

const client = new MongoClient(MONGODB_URI);

try {
  await client.connect();
  const db = client.db();

  const existing = await db
    .collection("templates")
    .findOne({ isExample: true, name: "Email de bienvenue" });

  if (existing) {
    console.log(
      'Example template "Email de bienvenue" already exists. Skipping.',
    );
    process.exit(0);
  }

  const now = new Date();

  await db.collection("templates").insertOne({
    userId: "__system__",
    name: "Email de bienvenue",
    files: {
      "/Email.tsx": {
        type: "file",
        name: "Email.tsx",
        path: "/Email.tsx",
        content: EMAIL_TSX,
      },
    },
    fields: [
      {
        id: "company-name",
        type: "text",
        label: "Nom de l'entreprise",
        defaultValue: "Votre marque",
      },
      {
        id: "hero-title",
        type: "text",
        label: "Titre principal",
        defaultValue: "Bienvenue !",
      },
      {
        id: "hero-subtitle",
        type: "text",
        label: "Sous-titre",
        defaultValue:
          "Personnalisez ce template via le panneau à droite ou en discutant avec l'IA.",
      },
      {
        id: "body-text",
        type: "text",
        label: "Corps du message",
        defaultValue:
          "Chaque zone de texte de cet email est éditable. Sélectionnez un champ dans le panneau à droite pour le modifier directement, ou demandez à l'IA n'importe quelle modification via le chat.",
      },
      {
        id: "cta-text",
        type: "text",
        label: "Texte du bouton",
        defaultValue: "Commencer maintenant",
      },
    ],
    fieldValues: {
      "company-name": "Votre marque",
      "hero-title": "Bienvenue !",
      "hero-subtitle":
        "Personnalisez ce template via le panneau à droite ou en discutant avec l'IA.",
      "body-text":
        "Chaque zone de texte de cet email est éditable. Sélectionnez un champ dans le panneau à droite pour le modifier directement, ou demandez à l'IA n'importe quelle modification via le chat.",
      "cta-text": "Commencer maintenant",
    },
    messages: [
      {
        id: "welcome-intro",
        role: "assistant",
        content: INTRO_TEXT,
        parts: [{ type: "text", text: INTRO_TEXT }],
      },
    ],
    isExample: true,
    createdAt: now,
    updatedAt: now,
  });

  console.log('Example template "Email de bienvenue" seeded successfully.');
} finally {
  await client.close();
}
