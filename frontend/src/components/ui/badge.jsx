import React from "react";

export const Badge = ({ children, className = "", ...props }) => (
  <span className={className} {...props}>{children}</span>
);

export default Badge;
