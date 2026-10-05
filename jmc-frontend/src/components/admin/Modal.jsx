import { FiX } from "react-icons/fi";

export default function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-back" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal-box ${wide ? "wide" : ""}`} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close"><FiX /></button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}
