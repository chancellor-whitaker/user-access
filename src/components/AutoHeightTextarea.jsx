import { useEffect, useRef } from "react";

export default function AutoHeightTextarea({
  className = "",
  value = "",
  style,
  ...rest
}) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      // Reset height to 'auto' to ensure accurate scrollHeight calculation
      textareaRef.current.style.height = "auto";
      // Set height to the content's scrollHeight
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]); // Re-run effect when 'value' changes

  return (
    <textarea
      className={["form-control", className].filter(Boolean).join(" ")}
      style={{ overflow: "hidden", resize: "none", ...style }} // Prevent manual resizing and hide scrollbar
      ref={textareaRef}
      value={value}
      {...rest}
    />
  );
}
