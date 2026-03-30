"use client"

export { toast } from "sonner"
export { Toaster as ToastProvider } from "./sonner"

export const ToastContext = {
  ToastProvider: `
  duration?: number
  position?: string
  children: yes
  ---
  example config: { component: "ToastProvider", props: { duration: 1, position: "value" }, children: ["Content"] }
  `.trim(),
}
