import styles from "./dashboard.module.css";
import skeletonStyles from "./DashboardSkeleton.module.css";

export default function DashboardLoading() {
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={skeletonStyles.titleSkeleton} />
        <div className={skeletonStyles.btnSkeleton} />
      </div>
      <div className={styles.grid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={skeletonStyles.card} />
        ))}
      </div>
    </div>
  );
}
