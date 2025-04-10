import { Router, Request, Response } from 'express'
import { getConnectedClient } from '../database/db'
import { ObjectId } from 'mongodb'
const bcrypt = require('bcryptjs')
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import authenticate from '../middlewares/authenticate'

dotenv.config()

const router = Router()

const getCollection = () => {
  const client = getConnectedClient()
  if (!client) {
    throw new Error('Database client is not connected')
  }
  return client.db('EasyScaleDb').collection('users')
}

router.post('/register', async (req: Request, res: Response) => {
  const collection = getCollection()
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(422).json({ msg: 'Insira todos os dados!' })
  }

  const userExists = await collection.findOne({ email })
  if (userExists) {
    return res.status(409).json({ msg: 'Usuário já cadastrado!' })
  }

  try {
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    const user = { name, email, password: passwordHash }
    const newUser = await collection.insertOne(user)

    const token = jwt.sign(
      { id: newUser.insertedId, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    )

    res.status(201).json({
      msg: 'Usuário cadastrado com sucesso!',
      token,
      user: {
        id: newUser.insertedId,
        name: user.name,
        email: user.email,
      },
    })
  } catch (error: any) {
    console.log(error)
    res
      .status(400)
      .json({ msg: 'Erro ao cadastrar usuário!', error: error.message })
  }
})

router.post('/login', async (req: Request, res: Response) => {
  const collection = getCollection()
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(422).json({ msg: 'Insira todos os dados!' })
  }

  const user = await collection.findOne({ email })
  if (!user) {
    return res.status(401).json({ msg: 'Usuário não encontrado!' })
  }

  const passwordMatch = await bcrypt.compare(password, user.password)
  if (!passwordMatch) {
    return res.status(401).json({ msg: 'Senha incorreta!' })
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, {
    expiresIn: '1d',
  })

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  })

  res.status(200).json({
    msg: 'Login realizado com sucesso!',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
  })
})

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('token')
  res.status(200).json({ msg: 'Logout realizado com sucesso!' })
})

router.get('/me', authenticate, async (req: Request, res: Response) => {
  const collection = getCollection()
  try {
    const user = await collection.findOne(
      { _id: new ObjectId((req as any).userId) },
      { projection: { password: 0 } }
    )

    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado!' })
    }

    res.status(200).json(user)
  } catch (error: any) {
    res
      .status(500)
      .json({ msg: 'Erro ao buscar usuário!', error: error.message })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  const collection = getCollection()
  const { id } = req.params

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'ID inválido!' })
  }

  try {
    const user = await collection.findOne({ _id: new ObjectId(id) })
    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado!' })
    }

    await collection.deleteOne({ _id: new ObjectId(id) })
    res.status(200).json({ msg: 'Usuário deletado com sucesso!' })
  } catch (error: any) {
    res
      .status(500)
      .json({ msg: 'Erro ao deletar usuário!', error: error.message })
  }
})

router.put('/users/:id', async (req: Request, res: Response) => {
  const collection = getCollection()
  const { id } = req.params
  const { name, email } = req.body

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'ID inválido!' })
  }

  try {
    const updatedUser = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { name, email } },
      { returnDocument: 'after' }
    )

    if (!updatedUser || !updatedUser.value) {
      return res.status(404).json({ msg: 'Usuário não encontrado!' })
    }

    res
      .status(200)
      .json({ msg: 'Usuário atualizado!', user: updatedUser.value })
  } catch (error: any) {
    res
      .status(500)
      .json({ msg: 'Erro ao atualizar usuário!', error: error.message })
  }
})

router.patch('/users/:id/password', async (req: Request, res: Response) => {
  const collection = getCollection()
  const { id } = req.params
  const { newPassword } = req.body

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'ID inválido!' })
  }

  try {
    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(newPassword, salt)

    const updatedUser = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { password: passwordHash } }
    )

    if (updatedUser.matchedCount === 0) {
      return res.status(404).json({ msg: 'Usuário não encontrado!' })
    }

    res.status(200).json({ msg: 'Senha atualizada com sucesso!' })
  } catch (error: any) {
    res
      .status(500)
      .json({ msg: 'Erro ao atualizar senha!', error: error.message })
  }
})

export default router
