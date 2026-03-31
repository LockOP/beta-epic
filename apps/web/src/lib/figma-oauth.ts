import type { Db } from "mongodb"

const FIGMA_TOKEN_DOC_ID = "figma-oauth"
const FIGMA_AUTH_BASE_URL = "https://www.figma.com/oauth"
const FIGMA_TOKEN_URL = "https://api.figma.com/v1/oauth/token"
const FIGMA_REFRESH_URL = "https://api.figma.com/v1/oauth/refresh"
const FIGMA_DEFAULT_SCOPES = ["current_user:read", "file_content:read", "file_metadata:read"] as const

export type StoredFigmaOAuth = {
  _id: string
  accessToken: string
  refreshToken?: string
  tokenType?: string
  userId?: string
  expiresAt?: Date
  scopes: string[]
  createdAt: Date
  updatedAt: Date
}

type FigmaTokenResponse = {
  access_token: string
  refresh_token?: string
  token_type?: string
  expires_in?: number
  user_id_string?: string
}

export function getFigmaOAuthConfig() {
  const clientId = process.env.FIGMA_CLIENT_ID?.trim() || ""
  const clientSecret = process.env.FIGMA_CLIENT_SECRET?.trim() || ""
  const redirectUri = process.env.FIGMA_OAUTH_REDIRECT_URI?.trim() || ""

  return {
    clientId,
    clientSecret,
    redirectUri,
    configured: Boolean(clientId && clientSecret && redirectUri),
  }
}

export function getFigmaRequestedScopes(): string[] {
  return [...FIGMA_DEFAULT_SCOPES]
}

export function buildFigmaAuthorizationUrl(state: string): string {
  const config = getFigmaOAuthConfig()
  if (!config.configured) {
    throw new Error("Figma OAuth is not configured.")
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: getFigmaRequestedScopes().join(","),
    state,
    response_type: "code",
  })

  return `${FIGMA_AUTH_BASE_URL}?${params.toString()}`
}

function getFigmaBasicAuthHeader(): string {
  const config = getFigmaOAuthConfig()
  if (!config.configured) {
    throw new Error("Figma OAuth is not configured.")
  }

  const credentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")
  return `Basic ${credentials}`
}

function computeExpiresAt(expiresIn?: number): Date | undefined {
  if (typeof expiresIn !== "number" || !Number.isFinite(expiresIn) || expiresIn <= 0) {
    return undefined
  }

  return new Date(Date.now() + expiresIn * 1000)
}

async function persistFigmaTokens(
  db: Db,
  tokenData: FigmaTokenResponse,
): Promise<StoredFigmaOAuth> {
  const now = new Date()
  const nextDoc: StoredFigmaOAuth = {
    _id: FIGMA_TOKEN_DOC_ID,
    accessToken: tokenData.access_token,
    ...(typeof tokenData.refresh_token === "string" && tokenData.refresh_token
      ? { refreshToken: tokenData.refresh_token }
      : {}),
    ...(typeof tokenData.token_type === "string" ? { tokenType: tokenData.token_type } : {}),
    ...(typeof tokenData.user_id_string === "string" ? { userId: tokenData.user_id_string } : {}),
    ...(computeExpiresAt(tokenData.expires_in) ? { expiresAt: computeExpiresAt(tokenData.expires_in) } : {}),
    scopes: getFigmaRequestedScopes(),
    createdAt: now,
    updatedAt: now,
  }

  const existing = await db.collection<StoredFigmaOAuth>("integration_tokens").findOne({ _id: FIGMA_TOKEN_DOC_ID })
  if (existing?.createdAt) {
    nextDoc.createdAt = existing.createdAt
  }
  if (!nextDoc.refreshToken && existing?.refreshToken) {
    nextDoc.refreshToken = existing.refreshToken
  }

  await db
    .collection<StoredFigmaOAuth>("integration_tokens")
    .updateOne({ _id: FIGMA_TOKEN_DOC_ID }, { $set: nextDoc }, { upsert: true })

  return nextDoc
}

export async function exchangeFigmaCodeForTokens(db: Db, code: string): Promise<StoredFigmaOAuth> {
  const config = getFigmaOAuthConfig()
  if (!config.configured) {
    throw new Error("Figma OAuth is not configured.")
  }

  const body = new URLSearchParams({
    redirect_uri: config.redirectUri,
    code,
    grant_type: "authorization_code",
  })

  const response = await fetch(FIGMA_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: getFigmaBasicAuthHeader(),
    },
    body: body.toString(),
    cache: "no-store",
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(`Figma token exchange failed (${response.status}): ${errorText || "Unknown error"}`)
  }

  const tokenData = (await response.json()) as FigmaTokenResponse
  return persistFigmaTokens(db, tokenData)
}

export async function refreshFigmaTokens(db: Db, refreshToken: string): Promise<StoredFigmaOAuth> {
  const response = await fetch(FIGMA_REFRESH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: getFigmaBasicAuthHeader(),
    },
    body: new URLSearchParams({ refresh_token: refreshToken }).toString(),
    cache: "no-store",
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(`Figma token refresh failed (${response.status}): ${errorText || "Unknown error"}`)
  }

  const tokenData = (await response.json()) as FigmaTokenResponse
  return persistFigmaTokens(db, {
    ...tokenData,
    refresh_token: tokenData.refresh_token || refreshToken,
  })
}

export async function getStoredFigmaOAuth(db: Db): Promise<StoredFigmaOAuth | null> {
  return db.collection<StoredFigmaOAuth>("integration_tokens").findOne({ _id: FIGMA_TOKEN_DOC_ID })
}

export async function getUsableFigmaAccessToken(db: Db): Promise<string | null> {
  const config = getFigmaOAuthConfig()
  const stored = await getStoredFigmaOAuth(db)

  if (
    stored?.accessToken &&
    (!stored.expiresAt || stored.expiresAt.getTime() - Date.now() > 5 * 60 * 1000)
  ) {
    return stored.accessToken
  }

  if (stored?.refreshToken && config.configured) {
    const refreshed = await refreshFigmaTokens(db, stored.refreshToken)
    return refreshed.accessToken
  }

  if (!config.configured) {
    const envToken = process.env.FIGMA_ACCESS_TOKEN?.trim() || ""
    return envToken || null
  }

  return null
}

export async function clearStoredFigmaOAuth(db: Db): Promise<void> {
  await db.collection<StoredFigmaOAuth>("integration_tokens").deleteOne({ _id: FIGMA_TOKEN_DOC_ID })
}
