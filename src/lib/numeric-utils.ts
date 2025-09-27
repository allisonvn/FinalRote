/**
 * Utilitários para formatação e validação de valores numéricos
 * Garante compatibilidade com campos NUMERIC do PostgreSQL
 */

/**
 * Formata um número para o tipo NUMERIC do PostgreSQL
 * @param value Valor a ser formatado
 * @param defaultValue Valor padrão se o valor for inválido
 * @param min Valor mínimo permitido
 * @param max Valor máximo permitido
 * @param decimals Número de casas decimais (padrão: 2)
 * @returns Número formatado
 */
export function safeNumeric(
  value: any, 
  defaultValue: number, 
  min?: number, 
  max?: number,
  decimals: number = 2
): number {
  const num = parseFloat(value);
  
  // Se não for um número válido, usar o valor padrão
  if (isNaN(num)) {
    return defaultValue;
  }
  
  // Aplicar limites mínimos e máximos
  let result = num;
  if (min !== undefined && result < min) result = min;
  if (max !== undefined && result > max) result = max;
  
  // Arredondar para o número de casas decimais especificado
  const factor = Math.pow(10, decimals);
  return Math.round(result * factor) / factor;
}

/**
 * Valida e formata traffic_allocation (NUMERIC(4,2))
 * @param value Valor do traffic allocation
 * @param defaultValue Valor padrão (padrão: 99.99)
 * @returns Valor formatado entre 1 e 99.99
 */
export function safeTrafficAllocation(value: any, defaultValue: number = 99.99): number {
  return safeNumeric(value, defaultValue, 1, 99.99, 2);
}

/**
 * Valida e formata confidence_level (NUMERIC(5,2))
 * @param value Valor do confidence level
 * @param defaultValue Valor padrão (padrão: 95)
 * @returns Valor formatado entre 80 e 99.99
 */
export function safeConfidenceLevel(value: any, defaultValue: number = 95): number {
  return safeNumeric(value, defaultValue, 80, 99.99, 2);
}

/**
 * Valida e formata traffic_percentage para variantes (NUMERIC(4,2))
 * @param value Valor do traffic percentage
 * @param defaultValue Valor padrão (padrão: 50)
 * @returns Valor formatado entre 0 e 99.99
 */
export function safeTrafficPercentage(value: any, defaultValue: number = 50): number {
  return safeNumeric(value, defaultValue, 0, 99.99, 2);
}

/**
 * Valida e formata conversion_rate (NUMERIC(8,4))
 * @param value Valor do conversion rate
 * @param defaultValue Valor padrão (padrão: 0)
 * @returns Valor formatado entre 0 e 9999.9999
 */
export function safeConversionRate(value: any, defaultValue: number = 0): number {
  return safeNumeric(value, defaultValue, 0, 9999.9999, 4);
}

/**
 * Valida e formata statistical_significance (NUMERIC(6,4))
 * @param value Valor da significância estatística
 * @param defaultValue Valor padrão (padrão: 0)
 * @returns Valor formatado entre 0 e 100.0000
 */
export function safeStatisticalSignificance(value: any, defaultValue: number = 0): number {
  return safeNumeric(value, defaultValue, 0, 100.0000, 4);
}
