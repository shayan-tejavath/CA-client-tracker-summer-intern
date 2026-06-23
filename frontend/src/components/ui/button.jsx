import React from "react";

export const Button = ({ children, asChild, className = "", ...props }) => {
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, { className, ...props });
  }

  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
};

export default Button;
