import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { MongoClient } from "mongodb";
import { Resend } from "resend";
import { connectDB } from "@/lib/db";
import { TemplateModel } from "@/lib/models/template.model";

const client = new MongoClient(process.env.MONGODB_URI!);
const db = client.db();

const resend = new Resend(process.env.RESEND_API_KEY);

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: mongodbAdapter(db),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    sendResetPassword: async ({ user, url }) => {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL!,
        to: user.email,
        subject: "Réinitialisation de votre mot de passe",
        html: `
          <p>Bonjour ${user.name},</p>
          <p>Cliquez sur le lien ci-dessous pour réinitialiser votre mot de passe :</p>
          <p><a href="${url}">${url}</a></p>
          <p>Ce lien expire dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
        `,
      });
    },
  },
  plugins: [nextCookies()],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await connectDB();
            const examples = await TemplateModel.find({ isExample: true }).lean();
            if (!examples.length) return;
            await TemplateModel.insertMany(
              examples.map((ex) => ({
                userId: user.id,
                name: ex.name,
                files: ex.files,
                fields: ex.fields,
                fieldValues: ex.fieldValues,
                isExample: false,
                messages: ex.messages ?? [],
              })),
            );
          } catch (err) {
            console.error("[auth] Failed to seed example templates for", user.id, err);
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
