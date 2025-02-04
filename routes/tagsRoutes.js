const express = require('express')
const router = express.Router()
const { getConnectedClient } = require('../database/db')
const { ObjectId } = require('mongodb')

const getCollection = () => {
  const client = getConnectedClient()
  const collection = client.db('EasyScaleDb').collection('tags')
  return collection
}

// Buscar todas as tags
router.get('/tags', async (req, res) => {
  const collection = getCollection()
  const tags = await collection.find({}).toArray()

  res.status(200).json(tags)
})

// Adicionar uma nova tag
router.post('/tags', async (req, res) => {
  const collection = getCollection()
  let { tag } = req.body

  if (!tag) {
    return res.status(400).json({ mssg: 'Erro: Nenhuma tag fornecida' })
  }

  tag = typeof tag === 'string' ? tag : JSON.stringify(tag)

  const newTag = await collection.insertOne({ tag })

  res.status(201).json({ tag, _id: newTag.insertedId })
})

// Deletar uma tag
router.delete('/tags/:id', async (req, res) => {
  const collection = getCollection()
  const _id = new ObjectId(req.params.id)

  const deletedTag = await collection.deleteOne({ _id })

  res.status(200).json(deletedTag)
})

module.exports = router
