import { NextResponse } from "next/server"
import clientPromise, { DB_NAME } from "@/lib/mongodb"

export async function GET() {
  const client = await clientPromise
  const db = client.db(DB_NAME)

  const chats = await db
    .collection("chats")
    .find({})
    .sort({ updatedAt: -1 })
    .toArray()

  return NextResponse.json(
    chats.map((c) => ({
      id: c._id.toString(),
      title: c.title,
      model: c.model,
      reasoningEffort: c.reasoningEffort ?? "medium",
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
  )
}

export async function POST(req: Request) {
  const { model = "gpt-5.4", reasoningEffort = "medium" } = await req.json()

  const client = await clientPromise
  const db = client.db(DB_NAME)

  const now = new Date()
  const result = await db.collection("chats").insertOne({
    title: "New chat",
    model,
    reasoningEffort,
    createdAt: now,
    updatedAt: now,
  })

  const chatId = result.insertedId.toString()

  // Seed the 3 fixed workspace files every new chat gets with minimal valid scaffolding
  await db.collection("workspace_files").insertMany([
    {
      chatId,
      name: "Initial State",
      type: "initial_state",
      content: JSON.stringify({}, null, 2),
      order: 0,
      createdAt: now,
      updatedAt: now,
    },
    {
      chatId,
      name: "Theme Tokens",
      type: "theme_tokens",
      content: JSON.stringify({ light: {} }, null, 2),
      order: 1,
      createdAt: now,
      updatedAt: now,
    },
    {
      chatId,
      name: "Root Config",
      type: "root_config",
      content: JSON.stringify({ component: "ItemGroup", children: [] }, null, 2),
      order: 2,
      createdAt: now,
      updatedAt: now,
    },
  ])

  return NextResponse.json({ id: chatId })
}
