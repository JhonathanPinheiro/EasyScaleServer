import { Router, Request, Response } from 'express'
import { ObjectId } from 'mongodb'
import { getConnectedClient } from '../database/db'

const router = Router()

interface Volunteer {
  name: string
  tags: string[]
  availability: string[]
}

type ScheduleEntry = {
  date: string
  schedule: Record<string, string>
}

const generateSchedule = (
  volunteers: Volunteer[],
  tags: string[],
  serviceDates: string[]
): ScheduleEntry[] => {
  const schedule: ScheduleEntry[] = serviceDates.map((date) => ({
    date,
    schedule: {},
  }))
  const assignedPeople = new Set<string>()

  const getAvailablePeople = (
    role: string,
    date: string,
    excludedNames: string[] = []
  ) =>
    volunteers.filter(
      (p) =>
        p.tags.includes(role) &&
        p.availability.includes(date) &&
        !excludedNames.includes(p.name)
    )

  const selectPerson = (
    availablePeople: Volunteer[],
    assignedPeople: Set<string>
  ) =>
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

router.post('/', async (req: Request, res: Response) => {
  const client = getConnectedClient()
  if (!client) {
    return res.status(500).json({ msg: 'Erro ao conectar ao banco de dados!' })
  }
  const collection = client.db('EasyScaleDb').collection('generatedSchedules')

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
  } catch (error: any) {
    res
      .status(500)
      .json({ msg: 'Erro ao gerar ou salvar a escala!', error: error.message })
  }
})

router.get('/', async (req: Request, res: Response) => {
  const client = getConnectedClient()
  if (!client) {
    return res.status(500).json({ msg: 'Erro ao conectar ao banco de dados!' })
  }
  const collection = client.db('EasyScaleDb').collection('generatedSchedules')

  const { date, volunteer, tag } = req.query

  try {
    const filter: Record<string, any> = {}

    if (date) {
      filter['schedule.date'] = date
    }

    if (volunteer && tag) {
      filter[`schedule.${tag}`] = volunteer
    } else if (tag) {
      filter[`schedule.${tag}`] = { $exists: true }
    }

    const schedules = await collection.find(filter).toArray()
    res.status(200).json(schedules)
  } catch (error: any) {
    res
      .status(500)
      .json({ msg: 'Erro ao buscar escalas!', error: error.message })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  const client = getConnectedClient()
  if (!client) {
    return res.status(500).json({ msg: 'Erro ao conectar ao banco de dados!' })
  }
  const collection = client.db('EasyScaleDb').collection('generatedSchedules')

  const id = req.params.id

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'ID inválido!' })
  }

  try {
    const deletedSchedule = await collection.deleteOne({
      _id: new ObjectId(id),
    })

    if (!deletedSchedule.deletedCount) {
      return res.status(404).json({ msg: 'Escala não encontrada!' })
    }

    res.status(200).json({ msg: 'Escala excluída com sucesso!' })
  } catch (error: any) {
    res
      .status(500)
      .json({ msg: 'Erro ao excluir escala!', error: error.message })
  }
})

export default router
