import { NextResponse } from "next/server"
import clientPromise, { DB_NAME } from "@/lib/mongodb"
import { exchangeFigmaCodeForTokens, getFigmaOAuthConfig } from "@/lib/figma-oauth"

function readCookieValue(cookieHeader: string | null, name: string): string | null {
  if (!cookieHeader) return null

  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`))
  return match ? decodeURIComponent(match[1]) : null
}

function buildReturnUrl(base: string, status: "success" | "error", message?: string): URL {
  const url = new URL(base)
  url.searchParams.set("figma_oauth", status)
  if (message) {
    url.searchParams.set("figma_message", message)
  }
  return url
}

export async function GET(req: Request) {
  const config = getFigmaOAuthConfig()
  const requestUrl = new URL(req.url)
  const state = requestUrl.searchParams.get("state")
  const code = requestUrl.searchParams.get("code")
  const providerError = requestUrl.searchParams.get("error")
  const cookieHeader = req.headers.get("cookie")
  const returnToCookie = readCookieValue(cookieHeader, "figma_oauth_return_to")
  const stateCookie = readCookieValue(cookieHeader, "figma_oauth_state")
  const fallbackReturnTo = `${requestUrl.origin}/chats`
  const returnTo = returnToCookie || fallbackReturnTo

  const cleanupRedirect = (url: URL) => {
    const response = NextResponse.redirect(url)
    response.cookies.set("figma_oauth_state", "", { path: "/", maxAge: 0 })
    response.cookies.set("figma_oauth_return_to", "", { path: "/", maxAge: 0 })
    return response
  }

  if (!config.configured) {
    return cleanupRedirect(buildReturnUrl(returnTo, "error", "Figma OAuth is not configured."))
  }

  if (providerError) {
    return cleanupRedirect(buildReturnUrl(returnTo, "error", providerError))
  }

  if (!state || !code || !stateCookie || state !== stateCookie) {
    return cleanupRedirect(buildReturnUrl(returnTo, "error", "Figma OAuth state validation failed."))
  }

  try {
    const client = await clientPromise
    const db = client.db(DB_NAME)
    await exchangeFigmaCodeForTokens(db, code)
    return cleanupRedirect(buildReturnUrl(returnTo, "success"))
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not complete Figma OAuth."
    return cleanupRedirect(buildReturnUrl(returnTo, "error", message))
  }
}
