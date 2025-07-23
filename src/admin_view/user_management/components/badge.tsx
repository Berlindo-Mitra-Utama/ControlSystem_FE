import type React from "react"

interface BadgeProps {
  children: React.ReactNode
  variant?: "default" | "outline"
  className?: string
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"

  const variants = {
    default: "bg-blue-600 text-blue-100",
    outline: "border border-gray-600 text-gray-300",
  }

  return <span className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</span>
}
