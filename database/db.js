require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb')

const uri = process.env.MONGODB_URI

const options = {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
}

let client
let isConnected = false

const connectToDB = async () => {
  if (client && isConnected) {
    console.log('Already connected to MongoDB.')
    return client
  }

  try {
    client = await MongoClient.connect(uri, options)
    isConnected = true
    console.log('Connected to MongoDB.')
  } catch (error) {
    isConnected = false
    console.error('Failed to connect to MongoDB:', error)
    setTimeout(connectToDB, 5000) // Tenta reconectar após 5 segundos em caso de falha
  }
  return client
}

const getConnectedClient = () => {
  if (!client || !isConnected) {
    console.log('No active MongoDB connection. Reconnecting...')
    connectToDB() // Tenta reconectar se a conexão estiver ausente
    return null // Retorna null até que a conexão seja reestabelecida
  }
  return client
}

// Função para fechar a conexão corretamente (opcional, mas recomendado)
const closeConnection = async () => {
  if (client) {
    await client.close()
    isConnected = false
    console.log('MongoDB connection closed.')
  }
}

module.exports = { connectToDB, getConnectedClient, closeConnection }
