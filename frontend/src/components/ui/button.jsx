import React from "react";

export const Button = ({
  children,
  asChild = false,
  variant = "",
  size = "",
  className = "",
  ...props
}) => {
  const classes = [
    "button",
    variant,
    size,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      className: `${children.props.className || ""} ${classes}`.trim(),
    });
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};

export default Button;