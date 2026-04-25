export default function MenuFrame({ kicker, title, children, tone = "olive", actions = null }) {
  return (
    <section className={`menu-frame menu-frame--${tone}`}>
      <div className="menu-frame__backdrop" aria-hidden="true" />
      <header className="menu-frame__header">
        <p className="menu-frame__kicker">{kicker}</p>
        <h1 className="menu-frame__title">{title}</h1>
      </header>
      <div className="menu-frame__body">{children}</div>
      {actions ? <footer className="menu-frame__actions">{actions}</footer> : null}
    </section>
  );
}
