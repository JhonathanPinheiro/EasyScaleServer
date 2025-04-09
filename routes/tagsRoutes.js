const express = require('express')
const router = express.Router()
const { getConnectedClient } = require('../database/db')
const { ObjectId } = require('mongodb')

const getCollection = () => {
  const client = getConnectedClient()
  return client.db('EasyScaleDb').collection('tags')
}

// Buscar todas as tags
router.get('/', async (req, res) => {
  try {
    const collection = getCollection()
    const tags = await collection.find({}).toArray()
    const formattedTags = tags.map((tag) => ({ id: tag._id, name: tag.name }))
    res.status(200).json(formattedTags)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar tags' })
  }
})

// Adicionar uma nova tag
router.post('/', async (req, res) => {
  try {
    const collection = getCollection()
    const { name } = req.body

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Nome inválido ou não fornecido' })
    }

    const newTag = await collection.insertOne({ name })
    res.status(201).json({ name, id: newTag.insertedId })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao adicionar tag' })
  }
})

// Deletar uma tag
router.delete('/:id', async (req, res) => {
  try {
    const collection = getCollection()
    const id = new ObjectId(req.params.id)

    const result = await collection.deleteOne({ _id: id })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Tag não encontrada' })
    }

    res.status(200).json({ message: 'Tag deletada com sucesso' })
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar tag' })
  }
})

module.exports = router
