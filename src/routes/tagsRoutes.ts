import { Router, Request, Response } from 'express'
import { getConnectedClient } from '../database/db'
import { ObjectId } from 'mongodb'

const router = Router()

const getCollection = () => {
  const client = getConnectedClient()
  if (!client) {
    throw new Error('Database client is not connected')
  }
  return client.db('EasyScaleDb').collection('tags')
}

router.get('/', async (_req: Request, res: Response) => {
  try {
    const collection = getCollection()
    const tags = await collection.find({}).toArray()
    const formattedTags = tags.map((tag) => ({
      id: tag._id.toString(),
      name: tag.name,
    }))
    res.status(200).json(formattedTags)
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao buscar tags' })
  }
})

router.post('/', async (req: Request, res: Response) => {
  try {
    const collection = getCollection()
    const { name } = req.body

    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Nome inválido ou não fornecido' })
    }

    const newTag = await collection.insertOne({ name })
    res.status(201).json({ name, id: newTag.insertedId.toString() })
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao adicionar tag' })
  }
})

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const collection = getCollection()
    const { id } = req.params

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'ID inválido' })
    }

    const result = await collection.deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Tag não encontrada' })
    }

    res.status(200).json({ message: 'Tag deletada com sucesso' })
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao deletar tag' })
  }
})

export default router
