import dotenv from 'dotenv'
dotenv.config()

import express, { Request, Response } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import cookieParser from 'cookie-parser'

import { connectToDB } from './database/db'
import authenticate from './middlewares/authenticate'

import userRoutes from './routes/userRoutes'
import volunteersRoutes from './routes/volunteersRoutes'
import tagsRoutes from './routes/tagsRoutes'
import rolesRoutes from './routes/rolesRoutes'
import generatedSchedulesRoutes from './routes/generatedSchedulesRoutes'

const app = express()
const port = process.env.PORT || 3001

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
app.use(helmet())

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Muitas requisições feitas por este IP, tente novamente mais tarde.',
})

app.use(limiter as unknown as express.RequestHandler)

app.use('/api/tags', authenticate, tagsRoutes)
app.use('/api/volunteers', authenticate, volunteersRoutes)
app.use('/api/functions', authenticate, rolesRoutes)
app.use('/api/schedule', authenticate, generatedSchedulesRoutes)

app.use('/api/users', userRoutes)

app.get('/', (_req: Request, res: Response) => {
  res.send('Hello World!')
})

const startServer = async () => {
  try {
    await connectToDB()
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
