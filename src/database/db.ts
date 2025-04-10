import dotenv from 'dotenv'
import { MongoClient, MongoClientOptions, ServerApiVersion } from 'mongodb'

dotenv.config()

const uri = process.env.MONGODB_URI as string

const options: MongoClientOptions = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
}

let client: MongoClient | null = null
let isConnected = false

export const connectToDB = async (): Promise<MongoClient | null> => {
  if (client && isConnected) {
    console.log('✅ Already connected to MongoDB.')
    return client
  }

  try {
    client = await MongoClient.connect(uri, options)
    isConnected = true
    console.log('✅ Connected to MongoDB.')
  } catch (error) {
    isConnected = false
    console.error('❌ Failed to connect to MongoDB:', error)
    setTimeout(connectToDB, 5000)
  }

  return client
}

export const getConnectedClient = (): MongoClient | null => {
  if (!client || !isConnected) {
    console.log('⚠️ No active MongoDB connection. Reconnecting...')
    connectToDB()
    return null
  }
  return client
}

export const closeConnection = async (): Promise<void> => {
  if (client) {
    await client.close()
    isConnected = false
    console.log('🔌 MongoDB connection closed.')
  }
}
