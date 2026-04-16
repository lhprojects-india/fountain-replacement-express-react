import { ArrowRight } from "lucide-react";
import React from "react";

const Button = React.forwardRef(({
  children,
  onClick,
  type = "button",
  showArrow,
  variant = "default",
  size = "default",
  className = "",
  disabled = false,
}, ref) => {
  const isAdminPage = typeof document !== "undefined" && document.body.classList.contains("admin-page");

  if (isAdminPage) {
    const baseClass = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 disabled:pointer-events-none";
    const variantClassMap = {
      default: "bg-sky-600 text-white border border-sky-600 hover:bg-sky-700",
      outline: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50",
      ghost: "bg-transparent text-slate-700 border border-transparent hover:bg-slate-100",
      destructive: "bg-rose-600 text-white border border-rose-600 hover:bg-rose-700",
      secondary: "bg-teal-100 text-teal-800 border border-teal-200 hover:bg-teal-200",
      link: "bg-transparent text-sky-700 border border-transparent underline-offset-4 hover:underline",
    };
    const sizeClassMap = {
      default: "h-10 px-4",
      sm: "h-9 px-3 text-xs",
      lg: "h-11 px-6",
      icon: "h-10 w-10 p-0",
    };
    const effectiveShowArrow = typeof showArrow === "boolean" ? showArrow : false;
    const variantClass = variantClassMap[variant] || variantClassMap.default;
    const sizeClass = sizeClassMap[size] || sizeClassMap.default;

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        className={`${baseClass} ${variantClass} ${sizeClass} ${className}`}
        disabled={disabled}
      >
        {children}
        {effectiveShowArrow && <ArrowRight size={16} />}
      </button>
    );
  }

  const legacyShowArrow = typeof showArrow === "boolean" ? showArrow : true;
  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      className={`laundryheap-btn flex items-center justify-center gap-2 ${className}`}
      disabled={disabled}
    >
      {children}
      {legacyShowArrow && <ArrowRight size={18} />}
    </button>
  );
});

Button.displayName = "Button";

export { Button };
export default Button;
