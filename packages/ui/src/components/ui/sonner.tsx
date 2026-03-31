"use client"

import * as React from "react"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

type ToastStyle = React.CSSProperties & {
  "--normal-bg": string
  "--normal-text": string
  "--normal-border": string
  "--border-radius": string
}

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

const useResolvedToastStyle = (theme: NonNullable<ToasterProps["theme"]>) => {
  const hostRef = React.useRef<HTMLDivElement>(null)
  const [style, setStyle] = React.useState<ToastStyle>({
    "--normal-bg": "hsl(0 0% 100%)",
    "--normal-text": "hsl(240 10% 3.9%)",
    "--normal-border": "hsl(240 5.9% 90%)",
    "--border-radius": "0.5rem",
  })

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const updateStyle = () => {
      const scopeRoot = hostRef.current?.closest("[data-epic-root]") as HTMLElement | null
      if (!scopeRoot) return

      const computed = window.getComputedStyle(scopeRoot)
      const popover = computed.getPropertyValue("--popover").trim()
      const popoverForeground = computed.getPropertyValue("--popover-foreground").trim()
      const border = computed.getPropertyValue("--border").trim()
      const radius = computed.getPropertyValue("--radius").trim()

      setStyle({
        "--normal-bg": popover ? `hsl(${popover})` : "hsl(0 0% 100%)",
        "--normal-text": popoverForeground
          ? `hsl(${popoverForeground})`
          : "hsl(240 10% 3.9%)",
        "--normal-border": border ? `hsl(${border})` : "hsl(240 5.9% 90%)",
        "--border-radius": radius || "0.5rem",
      })
    }

    updateStyle()

    const scopeRoot = hostRef.current?.closest("[data-epic-root]") as HTMLElement | null
    const scopeObserver = new MutationObserver(updateStyle)
    const htmlObserver = new MutationObserver(updateStyle)

    if (scopeRoot) {
      scopeObserver.observe(scopeRoot, { attributes: true, attributeFilter: ["class", "style"] })
    }

    htmlObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })

    window.addEventListener("resize", updateStyle)

    return () => {
      scopeObserver.disconnect()
      htmlObserver.disconnect()
      window.removeEventListener("resize", updateStyle)
    }
  }, [theme])

  return { hostRef, style }
}

const Toaster = ({ ...props }: ToasterProps) => {
  const theme = useResolvedToastTheme()
  const { hostRef, style } = useResolvedToastStyle(theme)

  return (
    <div ref={hostRef}>
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
        style={style}
        toastOptions={{
          classNames: {
            toast: "cn-toast",
          },
        }}
        {...props}
      />
    </div>
  )
}

export { Toaster }

export const SonnerContext = {
  Toaster: `
  position?: "top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"
  richColors?: boolean
  expand?: boolean
  duration?: number
  ---
  example config: { component: "Toaster", props: { position: "top-left", richColors: true, expand: true, duration: 1 } }
  `.trim(),
}
