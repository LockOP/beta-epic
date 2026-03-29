"use client"

import * as React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const useResolvedToastTheme = (): NonNullable<ToasterProps["theme"]> => {
  const [theme, setTheme] = React.useState<NonNullable<ToasterProps["theme"]>>("light")

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const media = window.matchMedia("(prefers-color-scheme: dark)")

    const updateTheme = () => {
      const root = document.documentElement
      const hasDarkClass = root.classList.contains("dark")
      const hasLightClass = root.classList.contains("light")

      if (hasDarkClass) {
        setTheme("dark")
        return
      }

      if (hasLightClass) {
        setTheme("light")
        return
      }

      setTheme(media.matches ? "dark" : "light")
    }

    updateTheme()

    const observer = new MutationObserver(updateTheme)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    media.addEventListener("change", updateTheme)

    return () => {
      observer.disconnect()
      media.removeEventListener("change", updateTheme)
    }
  }, [])

  return theme
}

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useResolvedToastTheme()

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4" />
        ),
        info: (
          <InfoIcon className="size-4" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4" />
        ),
        error: (
          <OctagonXIcon className="size-4" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }

export const SonnerContext = {
  Toaster: `
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"
  richColors?: boolean
  expand?: boolean
  duration?: number
  `.trim(),
}
