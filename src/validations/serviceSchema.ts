import { z } from 'zod'

export const serviceSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  date: z.string().datetime({ message: 'Data inválida' }),
})

export type ServiceInput = z.infer<typeof serviceSchema>
