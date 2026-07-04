import * as React from "react";

export function Badge({
  className = "",
  variant = "default",
  children,
  ...props
}) {
  const variantClass =
    variant === "secondary"
      ? "bg-slate-100 text-slate-800"
      : variant === "destructive"
      ? "bg-red-100 text-red-700"
      : variant === "outline"
      ? "border border-slate-300 bg-white text-slate-800"
      : "bg-violet-600 text-white";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}