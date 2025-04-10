import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()

const secret = process.env.JWT_SECRET!

export function generateToken(payload: object, expiresIn = '7d') {
  return jwt.sign(payload, secret, { expiresIn })
}

export function verifyToken(token: string) {
  return jwt.verify(token, secret)
}
