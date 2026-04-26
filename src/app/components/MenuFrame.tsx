import type { MouseEventHandler, ReactNode } from "react";
import styles from "./MenuFrame.module.css";
import FooterActions from "./FooterActions";

export type MenuFrameTone = "olive" | "amber" | "blue";

export interface FooterAction {
  key: string;
  label: string;
  onClick: MouseEventHandler<HTMLButtonElement>;
}

export interface MenuFrameProps {
  kicker: string;
  title: string;
  tone?: MenuFrameTone;
  className?: string;
  headerClassName?: string;
  containerClassName?: string;
  headerContent?: ReactNode;
  footerActions?: FooterAction[];
  children: ReactNode;
}

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

export default function MenuFrame({
  kicker,
  title,
  tone = "olive",
  className = "",
  headerClassName = "",
  containerClassName = "",
  headerContent = null,
  footerActions = [],
  children,
}: MenuFrameProps) {
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
      {footerActions.length ? (
        <footer className={styles.footer}>
          <FooterActions actions={footerActions} />
        </footer>
      ) : null}
    </section>
  );
}
