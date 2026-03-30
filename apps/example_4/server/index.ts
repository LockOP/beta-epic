import "dotenv/config";
import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";

const PORT = 3001;
const DB_NAME = "beta_epic";

const uri = `mongodb+srv://arulmadhava:${process.env.MONGODB_DB_PASSWORD}@genui.uwetqjj.mongodb.net/?appName=GenUI`;
const client = new MongoClient(uri);

async function main() {
  await client.connect();
  console.log("Connected to MongoDB");

  const app = express();
  app.use(cors());
  app.use(express.json());

  // GET /api/chats/:id/files
  app.get("/api/chats/:id/files", async (req, res) => {
    try {
      const db = client.db(DB_NAME);
      const files = await db
        .collection("workspace_files")
        .find({ chatId: req.params.id })
        .sort({ order: 1 })
        .toArray();

      res.json(
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
      );
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch files" });
    }
  });

  app.listen(PORT, () => {
    console.log(`API server running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
