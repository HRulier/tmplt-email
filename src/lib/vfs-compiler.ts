import path from "path";
import { build } from "esbuild";
import type { SerializedVFS } from "@/types";

export async function compileVFS(files: SerializedVFS): Promise<string> {
  const vfsMap: Record<string, string> = {};
  for (const node of Object.values(files)) {
    if (node.type === "file" && node.content !== undefined) {
      vfsMap[node.path] = node.content;
    }
  }

  if (!vfsMap["/Email.tsx"]) {
    throw new Error("No /Email.tsx found in VFS");
  }

  const result = await build({
    entryPoints: ["/Email.tsx"],
    bundle: true,
    platform: "node",
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
              const resolved = path.posix.resolve(dir, args.path);
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
