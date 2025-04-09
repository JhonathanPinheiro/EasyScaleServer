const express = require('express')
const router = express.Router()
const { getConnectedClient } = require('../database/db')
const { ObjectId } = require('mongodb')

const getCollection = () => {
  const client = getConnectedClient()
  return client.db('EasyScaleDb').collection('volunteers')
}

// Criar um voluntário
router.post('/', async (req, res) => {
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
      id: newVolunteer.insertedId.toString(),
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
router.get('/', async (req, res) => {
  const collection = getCollection()
  const { tag, date, name } = req.query

  let filter = {}

  if (tag) {
    filter.tags = tag
  }

  if (date) {
    filter.availableDates = date
  }

  if (name) {
    filter.name = { $regex: new RegExp(name, 'i') }
  }

  try {
    const volunteers = await collection.find(filter).toArray()
    const formattedVolunteers = volunteers.map(({ _id, ...rest }) => ({
      id: _id.toString(),
      ...rest,
    }))
    res.status(200).json(formattedVolunteers)
  } catch (error) {
    res
      .status(500)
      .json({ msg: 'Erro ao buscar voluntários', error: error.message })
  }
})

// Obter detalhes de um voluntário
router.get('/:id', async (req, res) => {
  const collection = getCollection()
  const _id = new ObjectId(req.params.id)
  const volunteer = await collection.findOne({ _id })
  if (!volunteer) {
    return res.status(404).json({ msg: 'Voluntário não encontrado!' })
  }
  res.status(200).json({ id: volunteer._id.toString(), ...volunteer })
})

// Atualizar voluntário
router.put('/:id', async (req, res) => {
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

  res
    .status(200)
    .json({
      id: updatedVolunteer.value._id.toString(),
      ...updatedVolunteer.value,
    })
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
