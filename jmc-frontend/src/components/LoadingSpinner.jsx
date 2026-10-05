export default function LoadingSpinner({ size = 28, label = "Loading" }) {
  return (
    <span className="jmc-spinner" role="status" aria-label={label} style={{ width: size, height: size }} />
  );
}
