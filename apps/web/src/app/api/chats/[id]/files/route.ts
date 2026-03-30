import { NextResponse } from "next/server"
import clientPromise, { DB_NAME } from "@/lib/mongodb"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const client = await clientPromise
  const db = client.db(DB_NAME)

  const files = await db
    .collection("workspace_files")
    .find({ chatId: id })
    .sort({ order: 1 })
    .toArray()

  return NextResponse.json(
    files.map((f) => ({
      id: f._id.toString(),
      chatId: f.chatId,
      name: f.name,
      type: f.type,
      content: f.content,
      order: f.order,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
    })),
  )
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { name } = await req.json()

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db(DB_NAME)

  // Only subconfigs can be created via this route
  const existingCount = await db
    .collection("workspace_files")
    .countDocuments({ chatId: id })

  const now = new Date()
  const result = await db.collection("workspace_files").insertOne({
    chatId: id,
    name: name.trim(),
    type: "subconfig",
    content: "",
    order: existingCount, // appended after existing files
    createdAt: now,
    updatedAt: now,
  })

  return NextResponse.json({ id: result.insertedId.toString() })
}
