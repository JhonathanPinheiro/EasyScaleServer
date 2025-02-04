const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')

const app = express()

const { connectToDB } = require('./database/db')

require('dotenv').config()

app.use(express.json())
app.use(cors())

// Usando helmet para segurança
app.use(helmet()) // Helmet ajuda a proteger contra algumas vulnerabilidades

// Configurando rate-limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // limite de 100 requisições por IP dentro de 15 minutos
  message: 'Muitas requisições, tente novamente mais tarde.',
})

app.use(limiter) // Aplica a limitação de requisições globalmente

const tagsRoutes = require('./routes/tagsRoutes')
const userRoutes = require('./routes/userRoutes')
const authenticate = require('./middleware/authenticate')

const port = process.env.PORT || 3001

app.use('/api/auth', authenticate, tagsRoutes)
app.use('/api/users', userRoutes)

async function startServer() {
  try {
    await connectToDB()
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    app.get('/', (req, res) => {
      res.send('Hello World!')
    })
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`)
    })
  } catch (error) {
    console.error('Failed to connect to the database:', error)
    process.exit(1)
  }
}

startServer()
