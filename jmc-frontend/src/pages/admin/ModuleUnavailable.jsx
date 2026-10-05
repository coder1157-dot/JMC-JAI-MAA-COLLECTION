export default function ModuleUnavailable({ title, children }) {
  return (
    <>
      <div className="admin-head"><h1>{title}</h1></div>
      <div className="module-note">
        <h2>Not available yet</h2>
        {children}
        <p>No data is shown here because the backend has no API for this module, and nothing is made up.</p>
      </div>
    </>
  );
}
