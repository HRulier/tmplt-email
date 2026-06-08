import Link from "next/link";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { TemplateModel } from "@/lib/models/template.model";
import { TemplateCard } from "./TemplateCard";
import styles from "./dashboard.module.css";

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  await connectDB();

  const templates = await TemplateModel.find({ userId: session!.user.id })
    .select("_id name updatedAt")
    .sort({ updatedAt: -1 })
    .lean();

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Email Templates</h1>
        <Link href="/generate" className={styles.newBtn}>
          + New Template
        </Link>
      </div>

      {templates.length === 0 ? (
        <p className={styles.empty}>No templates yet — create your first one.</p>
      ) : (
        <div className={styles.grid}>
          {templates.map((t) => (
            <TemplateCard
              key={t._id.toString()}
              id={t._id.toString()}
              name={t.name}
              updatedAt={t.updatedAt.toISOString()}
            />
          ))}
        </div>
      )}
    </div>
  );
}
