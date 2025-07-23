import type React from "react"

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "success" | "warning" | "danger" | "info"
  className?: string
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"

  const variants = {
    default: "bg-gray-700 text-gray-300",
    success: "bg-green-900/50 text-green-300 border border-green-700",
    warning: "bg-yellow-900/50 text-yellow-300 border border-yellow-700",
    danger: "bg-red-900/50 text-red-300 border border-red-700",
    info: "bg-blue-900/50 text-blue-300 border border-blue-700",
  }

  return <span className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</span>
}
