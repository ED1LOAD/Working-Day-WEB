import { useState } from "react";

function TitleField({ title, value }) {
  const [copied, setCopied] = useState(false);

  const isCopyable = typeof value === "string" || typeof value === "number";

  const handleCopy = () => {
    if (isCopyable) {
      navigator.clipboard.writeText(value.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 1000);
    }
  };

  return (
    <div
      className="title-field"
      onClick={isCopyable ? handleCopy : undefined}
      style={{ cursor: isCopyable ? "pointer" : "default" }}
      title={isCopyable ? "Нажмите, чтобы скопировать" : ""}
    >
      <div className="title-field-title">{title}</div>
      <div className={`title-field-value ${isCopyable ? "hoverable-field" : ""}`}>
        {copied ? "✔ Скопировано!" : value}
      </div>
    </div>
  );
}

export default TitleField;
