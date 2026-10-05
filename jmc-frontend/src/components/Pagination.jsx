export default function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null;
  const { page, pages } = pagination;
  const nums = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || Math.abs(i - page) <= 1) nums.push(i);
    else if (nums[nums.length - 1] !== "…") nums.push("…");
  }
  return (
    <nav className="jmc-pagination" aria-label="Pagination">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)}>
        Prev
      </button>
      {nums.map((n, i) =>
        n === "…" ? (
          <span key={`e${i}`} className="dots">
            …
          </span>
        ) : (
          <button key={n} className={n === page ? "active" : ""} onClick={() => onPage(n)}>
            {n}
          </button>
        )
      )}
      <button disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next
      </button>
    </nav>
  );
}
