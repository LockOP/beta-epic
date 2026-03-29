"use client"

export { toast } from "sonner"
export { Toaster as ToastProvider } from "./sonner"

export const ToastContext = {
  ToastProvider: `
  duration?: number
  position?: string
  children: yes
  `.trim(),
}
