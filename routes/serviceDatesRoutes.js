const express = require('express')
const router = express.Router()
const { getConnectedClient } = require('../database/db')
const { ObjectId } = require('mongodb')

const getCollection = () => {
  const client = getConnectedClient()
  return client.db('easyScaleDB').collection('serviceDates')
}

// Criar uma nova data de culto
router.post('/service-dates', async (req, res) => {
  const collection = getCollection()
  const { date } = req.body

  if (!date) {
    return res.status(400).json({ msg: 'Todos os campos são obrigatórios!' })
  }

  try {
    const newServiceDate = await collection.insertOne({
      date,
    })

    res.status(201).json({
      msg: 'Data de culto cadastrada com sucesso!',
      serviceDate: newServiceDate,
    })
  } catch (error) {
    res
      .status(500)
      .json({ msg: 'Erro ao cadastrar data de culto!', error: error.message })
  }
})

// Listar todas as datas de cultos
router.get('/service-dates', async (req, res) => {
  const collection = getCollection()
  try {
    const serviceDates = await collection.find({}).toArray()
    res.status(200).json(serviceDates)
  } catch (error) {
    res
      .status(500)
      .json({ msg: 'Erro ao buscar datas de cultos!', error: error.message })
  }
})

// Excluir uma data de culto
router.delete('/:id', async (req, res) => {
  const collection = getCollection()
  const _id = new ObjectId(req.params.id)

  try {
    const deletedServiceDate = await collection.deleteOne({ _id })
    res
      .status(200)
      .json({ msg: 'Data de culto excluída com sucesso!', deletedServiceDate })
  } catch (error) {
    res
      .status(500)
      .json({ msg: 'Erro ao excluir data de culto!', error: error.message })
  }
})

module.exports = router
