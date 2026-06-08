import React from "react";
import * as ReactJSXRuntime from "react/jsx-runtime";
import * as ReactJSXDevRuntime from "react/jsx-dev-runtime";
import * as ReactEmailComponents from "@react-email/components";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { compileVFS } from "@/lib/vfs-compiler";
import type { SerializedVFS } from "@/types";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { to, files, fieldValues = {} } = (await request.json()) as {
    to: string;
    files: SerializedVFS;
    fieldValues?: Record<string, string>;
  };

  if (!to || !files) {
    return Response.json({ error: "Missing to or files" }, { status: 400 });
  }

  let code: string;
  try {
    code = await compileVFS(files);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Compile error: ${msg}` }, { status: 422 });
  }

  const mod = { exports: {} as Record<string, unknown> };
  const sandboxRequire = (id: string): unknown => {
    if (id === "react") return React;
    if (id === "react/jsx-runtime") return ReactJSXRuntime;
    if (id === "react/jsx-dev-runtime") return ReactJSXDevRuntime;
    if (id === "@react-email/components") return ReactEmailComponents;
    throw new Error(`Cannot require "${id}"`);
  };

  try {
    // eslint-disable-next-line no-new-func
    new Function("module", "exports", "require", code)(mod, mod.exports, sandboxRequire);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return Response.json({ error: `Runtime error: ${msg}` }, { status: 422 });
  }

  const EmailComponent = (mod.exports as Record<string, unknown>).default as
    | React.ComponentType<{ fieldValues?: Record<string, string> }>
    | undefined;

  if (typeof EmailComponent !== "function") {
    return Response.json({ error: "Email.tsx has no default export" }, { status: 422 });
  }

  const html = await render(React.createElement(EmailComponent, { fieldValues }));

  const { error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@example.com",
    to,
    subject: "Test email",
    html,
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
