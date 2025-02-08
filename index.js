require('dotenv').config() // Certifique-se de carregar as variáveis antes de tudo

const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const cookieParser = require('cookie-parser')

const { connectToDB } = require('./database/db') // Certifique-se de que conecta corretamente ao MongoDB

const app = express()

app.use(cookieParser())
app.use(express.json())
app.use(
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
app.use(helmet()) // Segurança com Helmet

// Limite de requisições por IP (proteção contra DDoS)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo de 100 requisições por IP nesse período
  message: 'Muitas requisições, tente novamente mais tarde.',
})

app.use(limiter) // Aplica o rate-limit globalmente

// Importação das rotas
const tagsRoutes = require('./routes/tagsRoutes')
const functionsRoutes = require('./routes/functionsRoutes')
const generateScaleRoute = require('./routes/generateScaleRoute')
const serviceDatesRoutes = require('./routes/serviceDatesRoutes')
const volunteersRoutes = require('./routes/volunteersRoutes')
const userRoutes = require('./routes/userRoutes')
const authenticate = require('./middleware/authenticate')

const port = process.env.PORT || 3001

// Rotas protegidas com autenticação
app.use('/api/tags', authenticate, tagsRoutes)
app.use('/api/volunteers', authenticate, volunteersRoutes)
app.use('/api/functions', authenticate, functionsRoutes)
app.use('/api/schedule', authenticate, generateScaleRoute)
app.use('/api/service-dates', authenticate, serviceDatesRoutes)

// Rotas públicas
app.use('/api/users', userRoutes)

// Rota raiz
app.get('/', (req, res) => {
  res.send('Hello World!')
})

// Iniciando o servidor e conectando ao banco de dados
async function startServer() {
  try {
    await connectToDB() // Garante a conexão com o banco de dados

    console.log('Connected to MongoDB')

    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`)
    })
  } catch (error) {
    console.error('Failed to connect to the database:', error)
    process.exit(1)
  }
}

startServer()
