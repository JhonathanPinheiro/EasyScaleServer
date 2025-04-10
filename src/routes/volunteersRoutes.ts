import { Router, Request, Response } from 'express'
import { getConnectedClient } from '../database/db'
import { ObjectId } from 'mongodb'

const router = Router()

const getCollection = () => {
  const client = getConnectedClient()
  if (!client) {
    throw new Error('Database client is not connected')
  }
  return client.db('EasyScaleDb').collection('volunteers')
}

router.post('/', async (req: Request, res: Response) => {
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
  } catch (error: any) {
    res
      .status(500)
      .json({ msg: 'Erro ao criar voluntário', error: error.message })
  }
})

router.get('/', async (req: Request, res: Response) => {
  const collection = getCollection()
  const { tag, date, name } = req.query

  const filter: any = {}

  if (tag) filter.tags = tag
  if (date) filter.availableDates = date
  if (name) filter.name = { $regex: new RegExp(name as string, 'i') }

  try {
    const volunteers = await collection.find(filter).toArray()
    const formattedVolunteers = volunteers.map(({ _id, ...rest }) => ({
      id: _id.toString(),
      ...rest,
    }))
    res.status(200).json(formattedVolunteers)
  } catch (error: any) {
    res
      .status(500)
      .json({ msg: 'Erro ao buscar voluntários', error: error.message })
  }
})

router.get('/:id', async (req: Request, res: Response) => {
  const collection = getCollection()
  const { id } = req.params

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'ID inválido!' })
  }

  const _id = new ObjectId(id)
  const volunteer = await collection.findOne({ _id })

  if (!volunteer) {
    return res.status(404).json({ msg: 'Voluntário não encontrado!' })
  }

  res.status(200).json({ id: volunteer._id.toString(), ...volunteer })
})

router.put('/:id', async (req: Request, res: Response) => {
  const collection = getCollection()
  const { id } = req.params
  const { name, tags, availability, functions } = req.body

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'ID inválido!' })
  }

  const _id = new ObjectId(id)
  const updatedVolunteer = await collection.findOneAndUpdate(
    { _id },
    { $set: { name, tags, availability, functions } },
    { returnDocument: 'after' }
  )

  if (!updatedVolunteer || !updatedVolunteer.value) {
    return res.status(404).json({ msg: 'Voluntário não encontrado!' })
  }

  res.status(200).json({
    id: updatedVolunteer.value._id.toString(),
    ...updatedVolunteer.value,
  })
})

router.delete('/:id', async (req: Request, res: Response) => {
  const collection = getCollection()
  const { id } = req.params

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'ID inválido!' })
  }

  const _id = new ObjectId(id)
  const deletedVolunteer = await collection.deleteOne({ _id })

  if (!deletedVolunteer.deletedCount) {
    return res.status(404).json({ msg: 'Voluntário não encontrado!' })
  }

  res.status(200).json({ msg: 'Voluntário excluído com sucesso!' })
})

export default router
