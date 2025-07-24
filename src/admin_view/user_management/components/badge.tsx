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

  // Tambahan semua warna utama Tailwind
  red: "bg-red-900/50 text-red-300 border border-red-700",
  orange: "bg-orange-900/50 text-orange-300 border border-orange-700",
  amber: "bg-amber-900/50 text-amber-300 border border-amber-700",
  yellow: "bg-yellow-900/50 text-yellow-300 border border-yellow-700",
  lime: "bg-lime-900/50 text-lime-300 border border-lime-700",
  green: "bg-green-900/50 text-green-300 border border-green-700",
  emerald: "bg-emerald-900/50 text-emerald-300 border border-emerald-700",
  teal: "bg-teal-900/50 text-teal-300 border border-teal-700",
  cyan: "bg-cyan-900/50 text-cyan-300 border border-cyan-700",
  sky: "bg-sky-900/50 text-sky-300 border border-sky-700",
  blue: "bg-blue-900/50 text-blue-300 border border-blue-700",
  indigo: "bg-indigo-900/50 text-indigo-300 border border-indigo-700",
  violet: "bg-violet-900/50 text-violet-300 border border-violet-700",
  purple: "bg-purple-900/50 text-purple-300 border border-purple-700",
  fuchsia: "bg-fuchsia-900/50 text-fuchsia-300 border border-fuchsia-700",
  pink: "bg-pink-900/50 text-pink-300 border border-pink-700",
  rose: "bg-rose-900/50 text-rose-300 border border-rose-700",

  // Neutral tones
  slate: "bg-slate-900/50 text-slate-300 border border-slate-700",
  gray: "bg-gray-900/50 text-gray-300 border border-gray-700",
  zinc: "bg-zinc-900/50 text-zinc-300 border border-zinc-700",
  neutral: "bg-neutral-900/50 text-neutral-300 border border-neutral-700",
  stone: "bg-stone-900/50 text-stone-300 border border-stone-700",
};


  return <span className={`${baseClasses} ${variants[variant]} ${className}`}>{children}</span>
}
