import { ObjectId } from 'mongodb'

export interface Role {
  id: string
  name: string
}

export interface RoleDB {
  _id: ObjectId
  name: string
}
