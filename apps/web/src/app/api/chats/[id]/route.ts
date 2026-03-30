import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise, { DB_NAME } from "@/lib/mongodb"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const client = await clientPromise
  const db = client.db(DB_NAME)

  let chatId: ObjectId
  try {
    chatId = new ObjectId(id)
  } catch {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
  }

  const chat = await db.collection("chats").findOne({ _id: chatId })
  if (!chat) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const messages = await db
    .collection("messages")
    .find({ chatId: id })
    .sort({ createdAt: 1 })
    .toArray()

  return NextResponse.json({
    id: chat._id.toString(),
    title: chat.title,
    model: chat.model,
    reasoningEffort: chat.reasoningEffort ?? "medium",
    createdAt: chat.createdAt,
    messages: messages.map((m) => ({
      id: m._id.toString(),
      role: m.role,
      content: m.content,
      attachments: m.attachments ?? [],
      toolInteractions: m.toolInteractions ?? [],
      createdAt: m.createdAt,
    })),
  })
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await req.json()

  const client = await clientPromise
  const db = client.db(DB_NAME)

  let chatId: ObjectId
  try {
    chatId = new ObjectId(id)
  } catch {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
  }

  const update: Record<string, unknown> = { updatedAt: new Date() }
  if (body.title) update.title = body.title
  if (body.model) update.model = body.model
  if (body.reasoningEffort) update.reasoningEffort = body.reasoningEffort

  await db.collection("chats").updateOne({ _id: chatId }, { $set: update })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const client = await clientPromise
  const db = client.db(DB_NAME)

  let chatId: ObjectId
  try {
    chatId = new ObjectId(id)
  } catch {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
  }

  await db.collection("chats").deleteOne({ _id: chatId })
  await db.collection("messages").deleteMany({ chatId: id })
  await db.collection("workspace_files").deleteMany({ chatId: id })
  await db.collection("chat_preview_snapshots").deleteMany({ chatId: id })

  return NextResponse.json({ ok: true })
}
