import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise, { DB_NAME } from "@/lib/mongodb"

type PreviewCapturePayload = {
  index?: number
  scrollTop?: number
  width?: number
  height?: number
  dataUrl?: string
}

function sanitizeCapture(value: unknown): PreviewCapturePayload | null {
  if (!value || typeof value !== "object") return null

  const capture = value as PreviewCapturePayload
  if (typeof capture.dataUrl !== "string" || !capture.dataUrl.startsWith("data:image/")) {
    return null
  }

  return {
    dataUrl: capture.dataUrl,
    ...(typeof capture.index === "number" ? { index: capture.index } : {}),
    ...(typeof capture.scrollTop === "number" ? { scrollTop: capture.scrollTop } : {}),
    ...(typeof capture.width === "number" ? { width: capture.width } : {}),
    ...(typeof capture.height === "number" ? { height: capture.height } : {}),
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await req.json()

  try {
    new ObjectId(id)
  } catch {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
  }

  const captures = Array.isArray(body.captures)
    ? body.captures.map(sanitizeCapture).filter(Boolean).slice(0, 8)
    : []

  if (captures.length === 0) {
    return NextResponse.json({ error: "At least one preview capture is required." }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db(DB_NAME)
  const now = new Date()

  await db.collection("chat_preview_snapshots").updateOne(
    { chatId: id },
    {
      $set: {
        chatId: id,
        captures,
        updatedAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  )

  return NextResponse.json({
    ok: true,
    captureCount: captures.length,
    updatedAt: now,
  })
}
