import type { VFSNode, SerializedVFS } from "@/types";

interface FileNode {
  type: "file" | "directory";
  name: string;
  path: string;
  content?: string;
  children?: Map<string, FileNode>;
}

export class VirtualFileSystem {
  private root: FileNode = {
    type: "directory",
    name: "/",
    path: "/",
    children: new Map(),
  };

  // -------------------------
  // Internal helpers
  // -------------------------

  private getNode(path: string): FileNode | null {
    const parts = this.normalizePath(path).split("/").filter(Boolean);
    let current = this.root;
    for (const part of parts) {
      if (current.type !== "directory" || !current.children?.has(part)) {
        return null;
      }
      current = current.children.get(part)!;
    }
    return current;
  }

  private normalizePath(path: string): string {
    return path.startsWith("/") ? path : `/${path}`;
  }

  private ensureParentDirs(path: string): void {
    const parts = this.normalizePath(path).split("/").filter(Boolean);
    parts.pop(); // remove filename
    let current = this.root;
    let currentPath = "";
    for (const part of parts) {
      currentPath += `/${part}`;
      if (!current.children!.has(part)) {
        current.children!.set(part, {
          type: "directory",
          name: part,
          path: currentPath,
          children: new Map(),
        });
      }
      current = current.children!.get(part)!;
    }
  }

  // -------------------------
  // Public API
  // -------------------------

  createFile(path: string, content: string): void {
    const normalized = this.normalizePath(path);
    this.ensureParentDirs(normalized);
    const parts = normalized.split("/").filter(Boolean);
    const name = parts[parts.length - 1];
    const parentParts = parts.slice(0, -1);
    let parent = this.root;
    for (const part of parentParts) {
      parent = parent.children!.get(part)!;
    }
    parent.children!.set(name, {
      type: "file",
      name,
      path: normalized,
      content,
    });
  }

  readFile(path: string): string | null {
    const node = this.getNode(path);
    if (!node || node.type !== "file") return null;
    return node.content ?? null;
  }

  updateFile(path: string, content: string): void {
    const node = this.getNode(path);
    if (!node || node.type !== "file") {
      this.createFile(path, content);
      return;
    }
    node.content = content;
  }

  replaceInFile(path: string, oldStr: string, newStr: string): boolean {
    const node = this.getNode(path);
    if (!node || node.type !== "file" || node.content === undefined) return false;
    if (!node.content.includes(oldStr)) return false;
    node.content = node.content.replace(oldStr, newStr);
    return true;
  }

  insertInFile(path: string, insertLine: number, newStr: string): boolean {
    const node = this.getNode(path);
    if (!node || node.type !== "file" || node.content === undefined) return false;
    const lines = node.content.split("\n");
    lines.splice(insertLine, 0, newStr);
    node.content = lines.join("\n");
    return true;
  }

  deleteFile(path: string): void {
    const normalized = this.normalizePath(path);
    const parts = normalized.split("/").filter(Boolean);
    const name = parts[parts.length - 1];
    const parentParts = parts.slice(0, -1);
    let parent = this.root;
    for (const part of parentParts) {
      const next = parent.children?.get(part);
      if (!next) return;
      parent = next;
    }
    parent.children?.delete(name);
  }

  rename(oldPath: string, newPath: string): void {
    const node = this.getNode(oldPath);
    if (!node) return;
    const content = node.type === "file" ? node.content : undefined;
    this.deleteFile(oldPath);
    if (node.type === "file") {
      this.createFile(newPath, content ?? "");
    } else {
      // Recreate all children under the new path
      const entries = this.serialize();
      const oldNorm = this.normalizePath(oldPath);
      for (const [filePath, fileNode] of Object.entries(entries)) {
        if (filePath.startsWith(oldNorm + "/") && fileNode.type === "file") {
          const relative = filePath.slice(oldNorm.length);
          this.createFile(this.normalizePath(newPath) + relative, fileNode.content ?? "");
        }
      }
    }
  }

  listFiles(): string[] {
    const result: string[] = [];
    const walk = (node: FileNode) => {
      if (node.type === "file") {
        result.push(node.path);
      } else {
        node.children?.forEach((child) => walk(child));
      }
    };
    this.root.children?.forEach((child) => walk(child));
    return result;
  }

  // -------------------------
  // Serialization
  // -------------------------

  serialize(): SerializedVFS {
    const result: SerializedVFS = {};
    const walk = (node: FileNode) => {
      if (node.type === "file") {
        result[node.path] = {
          type: "file",
          name: node.name,
          path: node.path,
          content: node.content,
        };
      } else if (node.path !== "/") {
        result[node.path] = {
          type: "directory",
          name: node.name,
          path: node.path,
        };
      }
      node.children?.forEach((child) => walk(child));
    };
    this.root.children?.forEach((child) => walk(child));
    return result;
  }

  deserializeFromNodes(nodes: SerializedVFS): void {
    this.root = { type: "directory", name: "/", path: "/", children: new Map() };
    // Sort so directories are created before their files
    const sorted = Object.values(nodes).sort((a, b) =>
      a.path.split("/").length - b.path.split("/").length
    );
    for (const node of sorted) {
      if (node.type === "file") {
        this.createFile(node.path, node.content ?? "");
      }
    }
  }
}
