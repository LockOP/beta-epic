import { NextResponse } from "next/server"
import { buildFigmaAuthorizationUrl, getFigmaOAuthConfig } from "@/lib/figma-oauth"

export async function GET(req: Request) {
  const config = getFigmaOAuthConfig()
  if (!config.configured) {
    return NextResponse.json(
      { error: "Figma OAuth is not configured. Set FIGMA_CLIENT_ID, FIGMA_CLIENT_SECRET, and FIGMA_OAUTH_REDIRECT_URI." },
      { status: 400 },
    )
  }

  const requestUrl = new URL(req.url)
  const returnToParam = requestUrl.searchParams.get("return_to") || "/chats"
  const origin = requestUrl.origin
  const returnTo = returnToParam.startsWith("/")
    ? `${origin}${returnToParam}`
    : origin

  const state = crypto.randomUUID()
  const authorizationUrl = buildFigmaAuthorizationUrl(state)
  const response = NextResponse.redirect(authorizationUrl)

  response.cookies.set("figma_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  })
  response.cookies.set("figma_oauth_return_to", returnTo, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 10,
  })

  return response
}
