import { Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@lh/shared";

const DynamicFormField = ({ field, value, error, onChange }) => {
  const label = `${field.label}${field.required ? " *" : ""}`;
  const currentValue = value ?? "";

  if (field.type === "select") {
    return (
      <div className="space-y-1.5">
        <Label>{label}</Label>
        <Select value={String(currentValue || "")} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={`Select ${field.label}`} />
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
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={field.type === "number" ? "number" : "text"}
        value={currentValue}
        onChange={(event) => onChange(event.target.value)}
      />
      {field.helpText ? <p className="text-xs text-gray-500">{field.helpText}</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
};

export default DynamicFormField;
