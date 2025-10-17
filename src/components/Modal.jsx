import { useEffect, useRef } from "react";

const useClickOutside = (ref, handler) => {
  useEffect(() => {
    let startedInside = false;
    let startedWhenMounted = false;

    const listener = (event) => {
      // Do nothing if `mousedown` or `touchstart` started inside ref element
      if (startedInside || !startedWhenMounted) return;
      // Do nothing if clicking ref's element or descendent elements
      if (!ref.current || ref.current.contains(event.target)) return;

      handler(event);
    };

    const validateEventStart = (event) => {
      startedWhenMounted = ref.current;
      startedInside = ref.current && ref.current.contains(event.target);
    };

    document.addEventListener("mousedown", validateEventStart);
    document.addEventListener("touchstart", validateEventStart);
    document.addEventListener("click", listener);

    return () => {
      document.removeEventListener("mousedown", validateEventStart);
      document.removeEventListener("touchstart", validateEventStart);
      document.removeEventListener("click", listener);
    };
  }, [ref, handler]);
};

export default function Modal({
  body = <p>Modal body text goes here.</p>,
  title = "Modal title",
  active = false,
  footer,
  close,
}) {
  const dialogRef = useRef();

  useClickOutside(dialogRef, close);

  return (
    active && (
      <div className="modal fade show d-block blur" tabIndex={-1}>
        <div
          className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable"
          ref={dialogRef}
        >
          <div className="modal-content shadow">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button
                className="btn-close"
                aria-label="Close"
                onClick={close}
                type="button"
              />
            </div>
            <div className="modal-body">{body}</div>
            <div className="modal-footer">{footer}</div>
          </div>
        </div>
      </div>
    )
  );
}
