import { Suspense } from "react";
import { TemplateProvider } from "@/contexts/TemplateContext";
import { ChatPanel } from "@/components/generate/ChatPanel";
import { Workspace } from "@/components/generate/Workspace";
import styles from "./generate.module.css";

export default function GeneratePage() {
  return (
    <Suspense fallback={null}>
      <TemplateProvider>
        <div className={styles.page}>
          <aside className={styles.chat}>
            <ChatPanel />
          </aside>
          <section className={styles.workspace}>
            <Workspace />
          </section>
        </div>
      </TemplateProvider>
    </Suspense>
  );
}
