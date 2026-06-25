import * as React from "react";

export function Table({ className = "", children, ...props }) {
  return (
    <table className={`w-full border-collapse ${className}`} {...props}>
      {children}
    </table>
  );
}

export function TableHeader({ className = "", children, ...props }) {
  return (
    <thead className={className} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className = "", children, ...props }) {
  return (
    <tbody className={className} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className = "", children, ...props }) {
  return (
    <tr className={`border-b border-slate-200 ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className = "", children, ...props }) {
  return (
    <th
      className={`px-4 py-3 text-left text-sm font-semibold text-slate-700 ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ className = "", children, ...props }) {
  return (
    <td className={`px-4 py-3 text-sm text-slate-800 ${className}`} {...props}>
      {children}
    </td>
  );
}