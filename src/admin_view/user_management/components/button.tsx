import type React from "react"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "ghost"
  size?: "sm" | "md" | "lg"
  children: React.ReactNode
}

export function Button({ variant = "default", size = "md", className = "", children, ...props }: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"

  const variants = {
    default: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    outline: "border border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-white focus:ring-gray-500",
    ghost: "text-gray-300 hover:bg-gray-700 hover:text-white focus:ring-gray-500",
  }

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  }

  return (
    <button className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  )
}
