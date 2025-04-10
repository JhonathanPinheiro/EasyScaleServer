import { getCollection } from '@/lib/mongo'
import { Role } from '@/types/role'
import { ObjectId } from 'mongodb'

const COLLECTION_NAME = 'roles'

export const findAllRoles = async (): Promise<Role[]> => {
  const collection = await getCollection<Omit<Role, 'id'> & { _id: ObjectId }>(
    COLLECTION_NAME
  )
  const documents = await collection.find().toArray()
  return documents.map(({ _id, ...rest }) => ({
    id: _id.toHexString(),
    ...rest,
  }))
}

export const createRole = async (role: Omit<Role, 'id'>): Promise<Role> => {
  const collection = await getCollection<Omit<Role, 'id'> & { _id: ObjectId }>(
    COLLECTION_NAME
  )
  const result = await collection.insertOne({ ...role, _id: new ObjectId() })
  return {
    id: result.insertedId.toHexString(),
    ...role,
  }
}

export const deleteRole = async (id: string): Promise<void> => {
  const collection = await getCollection<Omit<Role, 'id'> & { _id: ObjectId }>(
    COLLECTION_NAME
  )
  await collection.deleteOne({ _id: new ObjectId(id) })
}
