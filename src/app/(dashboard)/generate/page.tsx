"use client";

import { Suspense } from "react";
import { FileSystemProvider } from "@/contexts/FileSystemContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { TemplateLoader } from "@/components/generate/TemplateLoader";
import { ChatPanel } from "@/components/generate/ChatPanel";
import { Workspace } from "@/components/generate/Workspace";
import styles from "./generate.module.css";

export default function GeneratePage() {
  return (
    <FileSystemProvider>
      <Suspense>
        <TemplateLoader>
          <ChatProvider>
            <div className={styles.page}>
              <aside className={styles.chat}>
                <ChatPanel />
              </aside>
              <section className={styles.workspace}>
                <Workspace />
              </section>
            </div>
          </ChatProvider>
        </TemplateLoader>
      </Suspense>
    </FileSystemProvider>
  );
}
