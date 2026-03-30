import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise, { DB_NAME } from "@/lib/mongodb"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; fileId: string }> },
) {
  const { fileId } = await params
  const { content } = await req.json()

  if (typeof content !== "string") {
    return NextResponse.json({ error: "content must be a string" }, { status: 400 })
  }

  let oid: ObjectId
  try {
    oid = new ObjectId(fileId)
  } catch {
    return NextResponse.json({ error: "Invalid fileId" }, { status: 400 })
  }

  const client = await clientPromise
  const db = client.db(DB_NAME)

  const result = await db.collection("workspace_files").updateOne(
    { _id: oid },
    { $set: { content, updatedAt: new Date() } },
  )

  if (result.matchedCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ ok: true })
}
