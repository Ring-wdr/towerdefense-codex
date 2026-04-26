import frameStyles from "./MenuFrame.module.css";
import type { FooterAction } from "./MenuFrame";

interface FooterActionsProps {
  actions: FooterAction[];
}

export default function FooterActions({ actions }: FooterActionsProps) {
  if (!actions?.length) {
    return null;
  }

  return actions.map(({ key, label, onClick }) => (
    <button key={key} className={frameStyles.button} type="button" onClick={onClick}>
      {label}
    </button>
  ));
}
