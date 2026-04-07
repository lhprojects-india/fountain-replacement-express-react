import { Check } from "lucide-react";

function CheckboxWithLabel({ label, checked, onChange }) {
  const handleClick = () => {
    onChange(!checked);
  };

  return (
    <div className="flex items-center gap-3 mb-6 animate-fade-in">
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={handleClick}
        className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 rounded border-2 transition-all overflow-hidden box-border p-0 shadow-sm ${
          checked ? 'bg-brand-shadeTeal border-brand-shadeTeal' : 'bg-white border-gray-300'
        }`}
        style={{ aspectRatio: '1 / 1' }}
      >
        {checked && <Check size={14} className="text-white" strokeWidth={3} />}
      </button>
      <span className="text-sm text-brand-shadeBlue font-medium">{label}</span>
    </div>
  );
}

export default CheckboxWithLabel;
export { CheckboxWithLabel };
