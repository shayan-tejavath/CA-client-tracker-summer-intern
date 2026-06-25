import * as React from "react";

export function Alert({ className = "", variant = "default", children, ...props }) {
  const variantClass =
    variant === "destructive"
      ? "border-red-200 bg-red-50 text-red-900"
      : "border-slate-200 bg-slate-50 text-slate-900";

  return (
    <div
      className={`rounded-2xl border px-4 py-3 ${variantClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AlertDescription({ className = "", children, ...props }) {
  return (
    <div className={`text-sm ${className}`} {...props}>
      {children}
    </div>
  );
}

export function AlertTitle({ className = "", children, ...props }) {
  return (
    <div className={`mb-1 font-semibold ${className}`} {...props}>
      {children}
    </div>
  );
}