import { useId } from "react";
import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@lh/shared";

function inputPropsForField(field) {
  const key = String(field.key || "").toLowerCase();
  const label = String(field.label || "").toLowerCase();

  if (field.type === "email" || key.includes("email") || label.includes("email")) {
    return { type: "email", autoComplete: "email", inputMode: "email", spellCheck: false };
  }
  if (field.type === "tel" || key.includes("phone") || label.includes("phone")) {
    return { type: "tel", autoComplete: "tel", inputMode: "tel" };
  }
  if (field.type === "number") {
    return { type: "number", inputMode: "decimal" };
  }
  return { type: "text", autoComplete: "off" };
}

const DynamicFormField = ({ field, value, error, onChange }) => {
  const id = useId();
  const label = `${field.label}${field.required ? " *" : ""}`;
  const currentValue = value ?? "";
  const inputProps = inputPropsForField(field);

  if (field.type === "select") {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <Select value={String(currentValue || "")} onValueChange={onChange}>
          <SelectTrigger id={id}>
            <SelectValue placeholder={`Select ${field.label}…`} />
          </SelectTrigger>
          <SelectContent>
            {(field.options || []).map((opt) => (
              <SelectItem key={String(opt.value)} value={String(opt.value)}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {field.helpText ? <p className="text-xs text-gray-500">{field.helpText}</p> : null}
        {error ? <p id={`${id}-error`} className="text-sm text-red-600" role="alert">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={field.key}
        value={currentValue}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...inputProps}
      />
      {field.helpText ? <p className="text-xs text-gray-500">{field.helpText}</p> : null}
      {error ? <p id={`${id}-error`} className="text-sm text-red-600" role="alert">{error}</p> : null}
    </div>
  );
};

export default DynamicFormField;
