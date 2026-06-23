import React from "react";

export const Card = ({ children, className = "", ...props }) => (
  <div className={className} {...props}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = "", ...props }) => (
  <div className={className} {...props}>{children}</div>
);

export const CardTitle = ({ children, className = "", ...props }) => (
  <h3 className={className} {...props}>{children}</h3>
);

export const CardDescription = ({ children, className = "", ...props }) => (
  <p className={className} {...props}>{children}</p>
);

export const CardContent = ({ children, className = "", ...props }) => (
  <div className={className} {...props}>{children}</div>
);

export default Card;
