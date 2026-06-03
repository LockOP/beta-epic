import { MongoClient } from "mongodb"

const uri = `mongodb+srv://arulmadhava:${process.env.MONGODB_DB_PASSWORD}@genui.uwetqjj.mongodb.net/?appName=GenUI`

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined
}

let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri)
    global._mongoClientPromise = client.connect().catch((err) => {
      global._mongoClientPromise = undefined
      throw err
    })
  }
  clientPromise = global._mongoClientPromise
} else {
  const client = new MongoClient(uri)
  clientPromise = client.connect()
}

export default clientPromise

export const DB_NAME = "beta_epic"
