import React from "react";
import * as ReactJSXRuntime from "react/jsx-runtime";
import * as ReactJSXDevRuntime from "react/jsx-dev-runtime";
import * as ReactEmailComponents from "@react-email/components";
import { render } from "@react-email/render";
import { compileVFS } from "@/lib/vfs-compiler";
import type { SerializedVFS } from "@/types";

export async function POST(request: Request) {
  const { files, fieldValues = {} } = (await request.json()) as {
    files: SerializedVFS;
    fieldValues?: Record<string, string>;
  };

  let code: string;
  try {
    code = await compileVFS(files);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: msg }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Execute the compiled CJS bundle in a sandboxed require context
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
    return new Response(JSON.stringify({ error: msg }), {
      status: 422,
      headers: { "Content-Type": "application/json" },
    });
  }

  const EmailComponent =
    (mod.exports as Record<string, unknown>).default as React.ComponentType<{
      fieldValues?: Record<string, string>;
    }> | undefined;

  if (typeof EmailComponent !== "function") {
    return new Response(
      JSON.stringify({ error: "Email.tsx n'a pas d'export default" }),
      { status: 422, headers: { "Content-Type": "application/json" } }
    );
  }

  const html = await render(React.createElement(EmailComponent, { fieldValues }));
  return new Response(html, { headers: { "Content-Type": "text/html" } });
}
