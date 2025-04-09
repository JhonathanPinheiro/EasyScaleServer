const express = require('express')
const { ObjectId } = require('mongodb')
const router = express.Router()
const { getConnectedClient } = require('../database/db')

// Função para gerar a escala
const generateSchedule = (volunteers, tags, serviceDates) => {
  const schedule = serviceDates.map((date) => ({ date, schedule: {} }))
  const assignedPeople = new Set()

  const getAvailablePeople = (role, date, excludedNames = []) =>
    volunteers.filter(
      (p) =>
        p.tags.includes(role) &&
        p.availability.includes(date) &&
        !excludedNames.includes(p.name)
    )

  const selectPerson = (availablePeople, assignedPeople) =>
    availablePeople.reduce((prev, curr) =>
      [...assignedPeople].filter((name) => name === prev.name).length <
      [...assignedPeople].filter((name) => name === curr.name).length
        ? prev
        : curr
    )

  serviceDates.forEach((date, weekIndex) => {
    const currentWeek = schedule[weekIndex].schedule
    const sortedTags = [...tags].sort(
      (a, b) =>
        getAvailablePeople(a, date, Object.values(currentWeek)).length -
        getAvailablePeople(b, date, Object.values(currentWeek)).length
    )

    sortedTags.forEach((role) => {
      const availablePeople = getAvailablePeople(
        role,
        date,
        Object.values(currentWeek)
      )
      const selectedPerson =
        availablePeople.length > 0
          ? selectPerson(availablePeople, assignedPeople)
          : null
      currentWeek[role] = selectedPerson ? selectedPerson.name : 'No assignment'
      if (selectedPerson) assignedPeople.add(selectedPerson.name)
    })
  })

  return schedule
}

// Rota para gerar e salvar a escala
router.post('/', async (req, res) => {
  const collection = getConnectedClient()
    .db('EasyScaleDb')
    .collection('generatedSchedules') // Certificando que a coleção está correta

  const { volunteers, tags, serviceDates } = req.body

  if (!volunteers || !tags || !serviceDates) {
    return res
      .status(400)
      .json({ msg: 'Voluntários, tags e datas são obrigatórios!' })
  }

  try {
    const schedule = generateSchedule(volunteers, tags, serviceDates)
    const result = await collection.insertOne({
      schedule,
      createdAt: new Date(),
    })

    res.status(201).json({
      msg: 'Escala gerada e salva com sucesso!',
      scheduleId: result.insertedId,
      schedule,
    })
  } catch (error) {
    res
      .status(500)
      .json({ msg: 'Erro ao gerar ou salvar a escala!', error: error.message })
  }
})

// Rota para obter todas as escalas geradas
router.get('/', async (req, res) => {
  const collection = getConnectedClient()
    .db('EasyScaleDb')
    .collection('generatedSchedules') // Certificando que a coleção é a correta

  const { date, volunteer, tag } = req.query

  try {
    const filter = {}

    if (date) {
      filter['schedule.date'] = date // Certifique-se de que o formato da data está correto
    }
    if (volunteer && tag) {
      filter[`schedule.${tag}`] = volunteer // Busca o voluntário apenas se a tag for informada
    } else if (tag) {
      filter[`schedule.${tag}`] = { $exists: true } // Busca escalas onde a tag existe
    }

    const schedules = await collection.find(filter).toArray()
    res.status(200).json(schedules)
  } catch (error) {
    res
      .status(500)
      .json({ msg: 'Erro ao buscar escalas!', error: error.message })
  }
})

// Rota para excluir uma escala
router.delete('/:id', async (req, res) => {
  const collection = getConnectedClient()
    .db('EasyScaleDb')
    .collection('generatedSchedules')

  const _id = new ObjectId(req.params.id)

  try {
    const deletedSchedule = await collection.deleteOne({ _id })

    if (deletedSchedule.deletedCount === 0) {
      return res.status(404).json({ msg: 'Escala não encontrada!' })
    }

    res.status(200).json({ msg: 'Escala excluída com sucesso!' })
  } catch (error) {
    res
      .status(500)
      .json({ msg: 'Erro ao excluir escala!', error: error.message })
  }
})

module.exports = router
