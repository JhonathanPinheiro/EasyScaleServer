import { Router, Request, Response } from 'express'
import { getConnectedClient } from '../database/db'
import { ObjectId } from 'mongodb'
import authenticate from '../middlewares/authenticate'

const router = Router()

const getCollection = () => {
  const client = getConnectedClient()
  if (!client) {
    throw new Error('Database client is not connected.')
  }
  return client.db('EasyScaleDb').collection('functions')
}

router.post('/', authenticate, async (req: Request, res: Response) => {
  const collection = getCollection()
  const { name } = req.body

  if (!name) {
    return res.status(400).json({ msg: 'Nome é obrigatório!' })
  }

  try {
    const newFunction = await collection.insertOne({ name })
    res.status(201).json({
      msg: 'Função criada com sucesso!',
      id: newFunction.insertedId.toString(),
      name,
    })
  } catch (error: any) {
    res.status(500).json({ msg: 'Erro ao criar função.', error: error.message })
  }
})

router.get('/', authenticate, async (_req: Request, res: Response) => {
  const collection = getCollection()
  try {
    const functions = await collection.find({}).toArray()
    const formatted = functions.map((func) => ({
      id: func._id.toString(),
      name: func.name,
    }))
    res.status(200).json(formatted)
  } catch (error: any) {
    res
      .status(500)
      .json({ msg: 'Erro ao listar funções.', error: error.message })
  }
})

router.put('/:id', authenticate, async (req: Request, res: Response) => {
  const collection = getCollection()
  const { id } = req.params
  const { name } = req.body

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'ID inválido!' })
  }

  try {
    const updatedFunction = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { name } },
      { returnDocument: 'after' }
    )

    if (!updatedFunction || !updatedFunction.value) {
      return res.status(404).json({ msg: 'Função não encontrada.' })
    }

    res.status(200).json({
      msg: 'Função atualizada com sucesso!',
      function: {
        id: updatedFunction.value._id.toString(),
        name: updatedFunction.value.name,
      },
    })
  } catch (error: any) {
    res
      .status(500)
      .json({ msg: 'Erro ao atualizar função.', error: error.message })
  }
})

router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  const collection = getCollection()
  const { id } = req.params

  if (!ObjectId.isValid(id)) {
    return res.status(400).json({ msg: 'ID inválido!' })
  }

  try {
    const deletedFunction = await collection.deleteOne({
      _id: new ObjectId(id),
    })

    if (!deletedFunction.deletedCount) {
      return res.status(404).json({ msg: 'Função não encontrada.' })
    }

    res.status(200).json({ msg: 'Função deletada com sucesso!' })
  } catch (error: any) {
    res
      .status(500)
      .json({ msg: 'Erro ao deletar função.', error: error.message })
  }
})

export default router
