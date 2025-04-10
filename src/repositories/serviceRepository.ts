import { getCollection } from '@/lib/mongo'
import { Service } from '../types/service'
import { ObjectId } from 'mongodb'

const COLLECTION_NAME = 'services'

export async function getAllServices(): Promise<Service[]> {
  const collection = await getCollection<Service>(COLLECTION_NAME)
  return collection.find().toArray()
}

export async function createService(
  data: Omit<Service, 'id'>
): Promise<Service> {
  const collection = await getCollection<Service>(COLLECTION_NAME)
  const result = await collection.insertOne(data)
  return { ...data, id: result.insertedId.toHexString() }
}

export async function deleteService(id: string) {
  const collection = await getCollection<Service>(COLLECTION_NAME)
  await collection.deleteOne({ _id: new ObjectId(id) })
}
