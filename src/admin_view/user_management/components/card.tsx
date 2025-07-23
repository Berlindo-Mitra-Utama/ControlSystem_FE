import type React from "react"

interface CardProps {
  children: React.ReactNode
  className?: string
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-gray-800 border border-gray-700 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 ${className}`}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className = "" }: CardProps) {
  return <div className={`px-6 py-4 border-b border-gray-700 ${className}`}>{children}</div>
}

export function CardTitle({ children, className = "" }: CardProps) {
  return <h3 className={`text-lg font-semibold text-white ${className}`}>{children}</h3>
}

export function CardDescription({ children, className = "" }: CardProps) {
  return <p className={`text-sm text-gray-400 mt-1 ${className}`}>{children}</p>
}

export function CardContent({ children, className = "" }: CardProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}
