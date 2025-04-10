import { Request, Response, NextFunction } from 'express'
import jwt, { JwtPayload } from 'jsonwebtoken'

interface AuthenticatedRequest extends Request {
  userId?: string
}

export default (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ msg: 'Acesso negado! Token não encontrado.' })
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as JwtPayload
    req.userId = decoded.id
    next()
  } catch (error) {
    return res.status(403).json({ msg: 'Token inválido!' })
  }
}
