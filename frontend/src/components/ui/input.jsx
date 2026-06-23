import React from "react";

export const Input = ({ className = "", ...props }) => {
  return <input className={className} {...props} />;
};

export default Input;
