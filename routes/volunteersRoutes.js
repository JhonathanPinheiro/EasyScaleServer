const express = require('express')
const router = express.Router()
const { getConnectedClient } = require('../database/db')
const { ObjectId } = require('mongodb')

const getCollection = () => {
  const client = getConnectedClient()
  return client.db('EasyScaleDb').collection('volunteers')
}

// Criar um voluntário
router.post('/volunteers', async (req, res) => {
  const collection = getCollection()
  const { name, tags, availability, functions } = req.body

  if (!name) {
    return res.status(400).json({ msg: 'Nome é obrigatório!' })
  }

  try {
    const newVolunteer = await collection.insertOne({
      name,
      tags: tags || [],
      availability: availability || [],
      functions: functions || [],
    })
    res.status(201).json({
      id: newVolunteer.insertedId,
      name,
      tags,
      availability,
      functions,
    })
  } catch (error) {
    res
      .status(500)
      .json({ msg: 'Erro ao criar voluntário', error: error.message })
  }
})

// Listar voluntários
router.get('/volunteers', async (req, res) => {
  const collection = getCollection()
  const { tag, date, name } = req.query // Pegando filtros da query string

  let filter = {}

  if (tag) {
    filter.tags = tag // Filtra por uma tag específica
  }

  if (date) {
    filter.availableDates = date // Filtra por uma data disponível
  }

  if (name) {
    filter.name = { $regex: new RegExp(name, 'i') } // Filtra pelo nome (case insensitive)
  }

  try {
    const volunteers = await collection.find(filter).toArray()
    res.status(200).json(volunteers)
  } catch (error) {
    res
      .status(500)
      .json({ msg: 'Erro ao buscar voluntários', error: error.message })
  }
})

// Obter detalhes de um voluntário
router.get('/volunteers/:id', async (req, res) => {
  const collection = getCollection()
  const _id = new ObjectId(req.params.id)
  const volunteer = await collection.findOne({ _id })
  if (!volunteer) {
    return res.status(404).json({ msg: 'Voluntário não encontrado!' })
  }
  res.status(200).json(volunteer)
})

// Atualizar voluntário
router.put('/volunteers/:id', async (req, res) => {
  const collection = getCollection()
  const _id = new ObjectId(req.params.id)
  const { name, tags, availability, functions } = req.body

  const updatedVolunteer = await collection.findOneAndUpdate(
    { _id },
    { $set: { name, tags, availability, functions } },
    { returnDocument: 'after' }
  )

  if (!updatedVolunteer.value) {
    return res.status(404).json({ msg: 'Voluntário não encontrado!' })
  }

  res.status(200).json(updatedVolunteer.value)
})

// Excluir voluntário
router.delete('/:id', async (req, res) => {
  const collection = getCollection()
  const _id = new ObjectId(req.params.id)
  const deletedVolunteer = await collection.deleteOne({ _id })

  if (!deletedVolunteer.deletedCount) {
    return res.status(404).json({ msg: 'Voluntário não encontrado!' })
  }

  res.status(200).json({ msg: 'Voluntário excluído com sucesso!' })
})

module.exports = router
