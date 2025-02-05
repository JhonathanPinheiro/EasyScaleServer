const express = require('express')
const router = express.Router()
const { getConnectedClient } = require('../database/db')
const { ObjectId } = require('mongodb')
const authenticate = require('../middleware/authenticate')

const getCollection = () => {
  const client = getConnectedClient()
  return client.db('EasyScaleDb').collection('functions')
}

// Criar uma nova função
router.post('/functions', authenticate, async (req, res) => {
  const collection = getCollection()
  const { name } = req.body

  if (!name) {
    return res.status(400).json({ msg: 'Nome é obrigatório!' })
  }

  try {
    const newFunction = await collection.insertOne({ name })
    res
      .status(201)
      .json({ msg: 'Função criada com sucesso!', function: newFunction })
  } catch (error) {
    res.status(500).json({ msg: 'Erro ao criar função.', error: error.message })
  }
})

// Listar todas as funções
router.get('/functions', authenticate, async (req, res) => {
  const collection = getCollection()
  try {
    const functions = await collection.find({}).toArray()
    res.status(200).json(functions)
  } catch (error) {
    res
      .status(500)
      .json({ msg: 'Erro ao listar funções.', error: error.message })
  }
})

// Atualizar uma função por ID
router.put('/functions/:id', authenticate, async (req, res) => {
  const collection = getCollection()
  const { id } = req.params
  const { name } = req.body

  try {
    const updatedFunction = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { name } },
      { returnDocument: 'after' }
    )
    res.status(200).json({
      msg: 'Função atualizada com sucesso!',
      function: updatedFunction,
    })
  } catch (error) {
    res
      .status(500)
      .json({ msg: 'Erro ao atualizar função.', error: error.message })
  }
})

// Excluir uma função por ID
router.delete('/:id', authenticate, async (req, res) => {
  const collection = getCollection()
  const { id } = req.params

  try {
    const deletedFunction = await collection.deleteOne({
      _id: new ObjectId(id),
    })
    if (!deletedFunction.deletedCount) {
      return res.status(404).json({ msg: 'Função não encontrada.' })
    }
    res.status(200).json({ msg: 'Função deletada com sucesso!' })
  } catch (error) {
    res
      .status(500)
      .json({ msg: 'Erro ao deletar função.', error: error.message })
  }
})

module.exports = router
