import styles from "./MenuFrame.module.css";

function joinClasses(...values) {
  return values.filter(Boolean).join(" ");
}

export default function MenuFrame({
  kicker,
  title,
  tone = "olive",
  className = "",
  headerClassName = "",
  containerClassName = "",
  footerClassName = "",
  headerContent = null,
  footerContent = null,
  children,
}) {
  return (
    <section className={joinClasses(styles.frame, styles[tone], className)}>
      <div className={styles.backdrop} aria-hidden="true" />
      <header className={joinClasses(styles.header, headerClassName)}>
        <div className={styles.titleLockup}>
          <p className={styles.kicker}>{kicker}</p>
          <h1 className={styles.title}>{title}</h1>
        </div>
        {headerContent ? <div className={styles.headerMeta}>{headerContent}</div> : null}
      </header>
      <div className={joinClasses(styles.container, containerClassName)}>{children}</div>
      {footerContent ? (
        <footer className={joinClasses(styles.footer, footerClassName)}>{footerContent}</footer>
      ) : null}
    </section>
  );
}
