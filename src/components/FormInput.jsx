import { useId } from "react";

export default function FormInput({
  label = "Label",
  className = "",
  type = "text",
  ...rest
}) {
  const id = useId();

  return (
    <div className="mb-3">
      <label className="form-label" htmlFor={id}>
        {label}
      </label>
      {"children" in rest ? (
        rest.children
      ) : (
        <input
          className={["form-control", className].filter((el) => el).join(" ")}
          type={type}
          id={id}
          {...rest}
        />
      )}
    </div>
  );
}
