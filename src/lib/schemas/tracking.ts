import { z } from 'zod'

// Schema para tracking de eventos
export const trackEventSchema = z.object({
  event_type: z.enum([
    'pageview',
    'page_view',
    'click',
    'conversion',
    'custom',
    'assignment'
  ]),
  event_name: z.string()
    .min(1)
    .max(100)
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/),
  experiment_id: z.string().uuid().optional(),
  variant_id: z.string().uuid().optional(),
  visitor_id: z.string().min(1).max(100),
  session_id: z.string().min(1).max(100).optional(),
  properties: z.record(z.unknown()).optional(),
  timestamp: z.string().datetime().optional(),
  url: z.string().url().optional(),
  referrer: z.string().url().optional().nullable(),
  user_agent: z.string().max(500).optional(),
  ip_address: z.string().ip().optional()
})

// Schema para batch de eventos
export const trackEventBatchSchema = z.object({
  events: z.array(trackEventSchema).min(1).max(100)
})

// Schema para assignment de variante
export const assignmentRequestSchema = z.object({
  visitor_id: z.string().min(1, 'visitor_id é obrigatório').max(100),
  user_agent: z.string().max(500).optional(),
  url: z.string().url().optional(),
  referrer: z.string().url().optional().nullable(),
  viewport: z.object({
    width: z.number().optional(),
    height: z.number().optional()
  }).optional(),
  timestamp: z.string().datetime().optional()
})

// Schema para filtros de eventos
export const eventFiltersSchema = z.object({
  eventType: z.enum(['all', 'pageview', 'page_view', 'click', 'conversion', 'custom']).default('all'),
  experimentId: z.string().uuid().or(z.literal('all')).default('all'),
  search: z.string().max(100).optional(),
  visitorId: z.string().max(100).optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  device: z.string().optional(),
  browser: z.string().optional(),
  country: z.string().optional(),
  utmSource: z.string().optional(),
  utmMedium: z.string().optional(),
  utmCampaign: z.string().optional(),
  minValue: z.number().optional(),
  maxValue: z.number().optional()
})

// Tipos inferidos
export type TrackEventInput = z.infer<typeof trackEventSchema>
export type TrackEventBatchInput = z.infer<typeof trackEventBatchSchema>
export type AssignmentRequestInput = z.infer<typeof assignmentRequestSchema>
export type EventFiltersInput = z.infer<typeof eventFiltersSchema>
