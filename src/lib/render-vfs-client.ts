import * as React from "react";
import * as ReactJSXRuntime from "react/jsx-runtime";
import * as ReactJSXDevRuntime from "react/jsx-dev-runtime";
import * as ReactEmailComponents from "@react-email/components";
import { render } from "@react-email/render";
import type { SerializedVFS } from "@/types";

type EsbuildModule = typeof import("esbuild-wasm");

let initPromise: Promise<EsbuildModule> | null = null;

function ensureInit(): Promise<EsbuildModule> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("renderVfsToHtml is client-only"));
  }
  if (!initPromise) {
    initPromise = (async () => {
      const m = await import("esbuild-wasm");
      await m.initialize({ wasmURL: "/esbuild.wasm" });
      return m;
    })().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  return initPromise;
}

function posixResolve(base: string, rel: string): string {
  const parts = (base + "/" + rel).split("/");
  const out: string[] = [];
  for (const p of parts) {
    if (!p || p === ".") continue;
    if (p === "..") out.pop();
    else out.push(p);
  }
  return "/" + out.join("/");
}

async function compileVFSClient(files: SerializedVFS): Promise<string> {
  const esbuild = await ensureInit();
  const vfsMap: Record<string, string> = {};
  for (const node of Object.values(files)) {
    if (node.type === "file" && node.content !== undefined) {
      vfsMap[node.path] = node.content;
    }
  }
  if (!vfsMap["/Email.tsx"]) throw new Error("No /Email.tsx found in VFS");

  const result = await esbuild.build({
    entryPoints: ["/Email.tsx"],
    bundle: true,
    format: "cjs",
    external: ["react", "react-dom", "@react-email/components"],
    write: false,
    logLevel: "silent",
    jsx: "automatic",
    jsxImportSource: "react",
    plugins: [
      {
        name: "vfs",
        setup(b) {
          b.onResolve({ filter: /.*/ }, (args) => {
            if (vfsMap[args.path]) return { path: args.path };
            if (args.path.startsWith("./") || args.path.startsWith("../")) {
              const dir = args.importer.split("/").slice(0, -1).join("/") || "/";
              const resolved = posixResolve(dir, args.path);
              for (const ext of ["", ".tsx", ".ts"]) {
                if (vfsMap[resolved + ext]) return { path: resolved + ext };
              }
            }
            return { external: true };
          });

          b.onLoad({ filter: /.*/ }, (args) => {
            const content = vfsMap[args.path];
            if (content !== undefined) return { contents: content, loader: "tsx" };
            return null;
          });
        },
      },
    ],
  });

  return result.outputFiles[0].text;
}

export async function renderVfsToHtml(
  files: SerializedVFS,
  fieldValues: Record<string, string> = {},
): Promise<string> {
  const code = await compileVFSClient(files);

  const mod = { exports: {} as Record<string, unknown> };
  const localRequire = (id: string): unknown => {
    if (id === "react") return React;
    if (id === "react/jsx-runtime") return ReactJSXRuntime;
    if (id === "react/jsx-dev-runtime") return ReactJSXDevRuntime;
    if (id === "@react-email/components") return ReactEmailComponents;
    throw new Error(`Cannot require "${id}"`);
  };

  new Function("module", "exports", "require", code)(mod, mod.exports, localRequire);

  const EmailComponent = (mod.exports as Record<string, unknown>).default as
    | React.ComponentType<{ fieldValues?: Record<string, string> }>
    | undefined;
  if (typeof EmailComponent !== "function") {
    throw new Error("Email.tsx n'a pas d'export default");
  }

  return await render(React.createElement(EmailComponent, { fieldValues }));
}
