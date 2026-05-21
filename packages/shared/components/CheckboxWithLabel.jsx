import { useId } from "react";
import { Check } from "lucide-react";

function CheckboxWithLabel({ label, checked, onChange }) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className="flex items-center gap-3 mb-6 animate-fade-in cursor-pointer"
    >
      <button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded border-2 transition-[color,background-color,border-color,box-shadow] duration-200 overflow-hidden box-border p-0 shadow-sm ${
          checked ? "bg-brand-shadeTeal border-brand-shadeTeal" : "bg-white border-gray-300"
        }`}
        style={{ aspectRatio: "1 / 1" }}
      >
        {checked && (
          <Check size={14} className="text-white" strokeWidth={3} aria-hidden="true" />
        )}
      </button>
      <span className="text-sm text-brand-shadeBlue font-medium">{label}</span>
    </label>
  );
}

export default CheckboxWithLabel;
export { CheckboxWithLabel };
