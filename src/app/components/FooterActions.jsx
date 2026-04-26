import frameStyles from "./MenuFrame.module.css";

export default function FooterActions({ actions }) {
  if (!actions?.length) {
    return null;
  }

  return actions.map(({ key, label, onClick }) => (
    <button key={key} className={frameStyles.button} type="button" onClick={onClick}>
      {label}
    </button>
  ));
}
