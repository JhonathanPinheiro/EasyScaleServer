const express = require('express')
const router = express.Router()
const { getConnectedClient } = require('../database/db')
const { ObjectId } = require('mongodb')
const authMiddleware = require('../middleware/authMiddleware')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv').config()

const getCollection = () => {
  const client = getConnectedClient()
  return client.db('EasyScaleDb').collection('users')
}

router.post('/register', async (req, res) => {
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
      process.env.JWT_SECRET,
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
  } catch (error) {
    console.log(error)
    res
      .status(400)
      .json({ msg: 'Erro ao cadastrar usuário!', error: error.message })
  }
})

router.post('/login', async (req, res) => {
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

  // 🔐 Gerar Token JWT
  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: '1d', // Token expira em 1 dia
  })

  // 🍪 Enviar Token via Cookie Seguro
  res.cookie('token', token, {
    httpOnly: true, // 🔒 Impede acesso via JavaScript
    secure: process.env.NODE_ENV === 'production', // 🔐 Apenas HTTPS em produção
    sameSite: 'Strict', // 🚫 Protege contra CSRF
    maxAge: 24 * 60 * 60 * 1000, // ⏳ Expira em 1 dia
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

router.post('/logout', (req, res) => {
  res.clearCookie('token')
  res.status(200).json({ msg: 'Logout realizado com sucesso!' })
})

router.get('/me', authMiddleware, async (req, res) => {
  const collection = getCollection()

  try {
    const user = await collection.findOne(
      { _id: new ObjectId(req.userId) },
      { projection: { password: 0 } } // Não retorna a senha
    )

    if (!user) {
      return res.status(404).json({ msg: 'Usuário não encontrado!' })
    }

    res.status(200).json(user)
  } catch (error) {
    res
      .status(500)
      .json({ msg: 'Erro ao buscar usuário!', error: error.message })
  }
})

router.delete('/:id', async (req, res) => {
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
  } catch (error) {
    res
      .status(500)
      .json({ msg: 'Erro ao deletar usuário!', error: error.message })
  }
})

router.put('/users/:id', async (req, res) => {
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
      { returnDocument: 'after' } // Retorna o usuário atualizado
    )

    if (!updatedUser.value) {
      return res.status(404).json({ msg: 'Usuário não encontrado!' })
    }

    res
      .status(200)
      .json({ msg: 'Usuário atualizado!', user: updatedUser.value })
  } catch (error) {
    res
      .status(500)
      .json({ msg: 'Erro ao atualizar usuário!', error: error.message })
  }
})

router.patch('/users/:id/password', async (req, res) => {
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
  } catch (error) {
    res
      .status(500)
      .json({ msg: 'Erro ao atualizar senha!', error: error.message })
  }
})

module.exports = router
