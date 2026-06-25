import * as React from "react";

export function Dialog({ open, onOpenChange, children }) {
  if (!open) return null;

  const close = () => {
    if (typeof onOpenChange === "function") onOpenChange(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") close();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={close}
      onKeyDown={handleKeyDown}
      role="presentation"
    >
      <div
        className="w-full max-w-5xl max-h-[90vh] overflow-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

export function DialogContent({ children, className = "", ...props }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function DialogHeader({ children, className = "", ...props }) {
  return (
    <div className={`mb-6 space-y-2 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function DialogTitle({ children, className = "", ...props }) {
  return (
    <h2 className={`text-2xl font-bold tracking-tight text-slate-900 ${className}`} {...props}>
      {children}
    </h2>
  );
}

export function DialogDescription({ children, className = "", ...props }) {
  return (
    <p className={`text-sm text-slate-600 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function DialogFooter({ children, className = "", ...props }) {
  return (
    <div className={`mt-6 flex flex-wrap justify-end gap-3 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function DialogTrigger({ children }) {
  return <>{children}</>;
}

export function DialogClose({ children }) {
  return <>{children}</>;
}