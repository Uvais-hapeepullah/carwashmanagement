import { useEffect, useRef } from "react";
import Icon from "./Icon.jsx";

export default function Modal({
  title,
  description,
  onClose,
  children,
  wide = false,
  className = "",
}) {
  const panel = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const getItems = () => [
      ...panel.current.querySelectorAll(
        "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href]",
      ),
    ];
    const items = getItems();
    (
      items.find((item) => item.tagName !== "BUTTON") ||
      items[0] ||
      panel.current
    ).focus();
    function handleKey(event) {
      if (event.key === "Escape") onClose();
      if (event.key === "Tab") {
        const items = getItems();
        const first = items[0];
        const last = items[items.length - 1];
        if (!panel.current.contains(document.activeElement)) {
          event.preventDefault();
          first?.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", handleKey);
      previous?.focus();
    };
  }, [onClose]);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`modal ${wide ? "wide" : ""} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        aria-describedby={description ? "dialog-description" : undefined}
        ref={panel}
        tabIndex={-1}
      >
        <div className="modal-header no-print">
          <div>
            <h2 id="dialog-title">{title}</h2>
            {description && <p id="dialog-description">{description}</p>}
          </div>
          <button
            className="icon-button modal-close"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <Icon name="close" />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
