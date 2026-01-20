/**
 * Schemas Index
 * @description Exporta todos os schemas de validação Zod
 */

// Experiment schemas
export {
  variantSchema,
  createExperimentSchema,
  updateExperimentSchema,
  experimentStatusSchema,
  type CreateExperimentInput,
  type UpdateExperimentInput,
  type VariantInput,
  type ExperimentStatusInput
} from './experiment'

// Tracking schemas
export {
  trackEventSchema,
  trackEventBatchSchema,
  assignmentRequestSchema,
  eventFiltersSchema,
  type TrackEventInput,
  type TrackEventBatchInput,
  type AssignmentRequestInput,
  type EventFiltersInput
} from './tracking'

// Kiwify webhook schemas
export {
  kiwifyWebhookSchema,
  webhookSignatureSchema,
  type KiwifyWebhookPayload,
  type KiwifyCustomer,
  type KiwifyProduct,
  type KiwifyOrder,
  type KiwifySubscription
} from './kiwify-webhook'
