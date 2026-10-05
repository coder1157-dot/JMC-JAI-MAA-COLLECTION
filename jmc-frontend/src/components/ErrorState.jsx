export default function ErrorState({ message = "Unable to load products. Please try again.", onRetry }) {
  return (
    <div className="state-box state-error" role="alert">
      <div className="state-ornament">◆</div>
      <h3>Something went wrong</h3>
      <p>{message}</p>
      {onRetry && (
        <button className="btn-jmc btn-jmc-outline" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
