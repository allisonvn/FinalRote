import { z } from 'zod'

// Schema para variante
export const variantSchema = z.object({
  name: z.string()
    .min(1, 'Nome da variante é obrigatório')
    .max(100, 'Nome muito longo'),
  key: z.string()
    .min(1, 'Chave é obrigatória')
    .max(50, 'Chave muito longa')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Chave deve conter apenas letras, números, - e _'),
  is_control: z.boolean().default(false),
  weight: z.number().min(0).max(100).default(50),
  changes: z.array(z.object({
    selector: z.string().min(1, 'Seletor é obrigatório'),
    property: z.string().min(1, 'Propriedade é obrigatória'),
    value: z.string()
  })).optional()
})

// Schema para criação de experimento
export const createExperimentSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(200, 'Nome muito longo'),
  description: z.string().max(1000).optional(),
  project_id: z.string().uuid('ID do projeto inválido').optional(),
  url_pattern: z.string()
    .url('URL inválida')
    .or(z.string().regex(/^\/.*/, 'Deve ser uma URL ou path começando com /'))
    .optional(),
  algorithm: z.enum(['ab_test', 'thompson_sampling', 'ucb1', 'epsilon_greedy', 'uniform'])
    .default('thompson_sampling'),
  variants: z.array(variantSchema)
    .min(2, 'Experimento precisa de pelo menos 2 variantes')
    .max(10, 'Máximo de 10 variantes')
    .optional(),
  goal_event: z.string()
    .min(1, 'Evento de conversão é obrigatório')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Nome de evento inválido')
    .optional(),
  traffic_allocation: z.number().min(1).max(100).default(100)
})

// Schema para atualização
export const updateExperimentSchema = createExperimentSchema.partial().extend({
  id: z.string().uuid()
})

// Schema para mudança de status
export const experimentStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['draft', 'running', 'paused', 'completed'])
})

// Tipos inferidos
export type CreateExperimentInput = z.infer<typeof createExperimentSchema>
export type UpdateExperimentInput = z.infer<typeof updateExperimentSchema>
export type VariantInput = z.infer<typeof variantSchema>
export type ExperimentStatusInput = z.infer<typeof experimentStatusSchema>
