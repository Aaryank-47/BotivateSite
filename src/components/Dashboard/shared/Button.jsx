"use client";

import { RefreshCw, AlertCircle } from "lucide-react";

// Shared Button component used across Dashboard
const Button = ({
  children,
  variant = "default",
  className = "",
  disabled = false,
  ...props
}) => {
  const baseClasses =
    "px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    default:
      "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-gray-400",
    outline:
      "border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500 disabled:bg-gray-100",
    secondary:
      "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 disabled:bg-gray-400",
  };
  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${className} ${disabled ? "cursor-not-allowed" : ""
        }`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
