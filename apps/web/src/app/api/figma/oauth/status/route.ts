import clientPromise, { DB_NAME } from "@/lib/mongodb"
import { getFigmaOAuthConfig, getStoredFigmaOAuth, getUsableFigmaAccessToken } from "@/lib/figma-oauth"

export async function GET() {
  const config = getFigmaOAuthConfig()
  const client = await clientPromise
  const db = client.db(DB_NAME)
  const stored = await getStoredFigmaOAuth(db)
  let token: string | null = null
  let error: string | null = null

  try {
    token = await getUsableFigmaAccessToken(db)
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not refresh Figma token."
  }

  return Response.json({
    configured: config.configured,
    connected: Boolean(token && stored),
    hasStoredToken: Boolean(stored?.accessToken),
    expiresAt: stored?.expiresAt?.toISOString() ?? null,
    scopes: stored?.scopes ?? [],
    error,
  })
}
