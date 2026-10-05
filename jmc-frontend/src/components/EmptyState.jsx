export default function EmptyState({ title = "No jewellery found.", text, action }) {
  return (
    <div className="state-box">
      <div className="state-ornament">◆</div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
