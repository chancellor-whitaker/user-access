import { useId } from "react";

export default function FormCheck({
  type = "checkbox",
  label = "Label",
  className = "",
  inline,
  ...rest
}) {
  const id = useId();

  return (
    <div
      className={["form-check", inline && "form-check-inline"]
        .filter(Boolean)
        .join(" ")}
    >
      <input
        className={["form-check-input shadow-sm", className]
          .filter((el) => el)
          .join(" ")}
        type={type}
        id={id}
        {...rest}
      />
      <label className="form-check-label" htmlFor={id}>
        {label}
      </label>
    </div>
  );
}
