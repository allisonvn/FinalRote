// Teste simples da API para debug
const experimentId = '2f65ab69-32af-475e-af2a-a7abb37c2925'
const apiKey = 'exp_9273622d811bc1414558f2d973190499'

const testData = {
  visitor_id: 'test_user_simple',
  user_agent: 'Mozilla/5.0 Test',
  url: 'https://esmalt.com.br/test',
  referrer: '',
  timestamp: new Date().toISOString(),
  viewport: { width: 1920, height: 1080 }
}

console.log('🔍 Testando API com dados:')
console.log('Experiment ID:', experimentId)
console.log('API Key:', apiKey)
console.log('Test Data:', testData)

fetch(`https://rotafinal.com.br/api/experiments/${experimentId}/assign`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    'X-RF-Version': '2.0.0'
  },
  body: JSON.stringify(testData)
})
.then(response => {
  console.log('📡 Response status:', response.status)
  console.log('📡 Response headers:', response.headers)
  return response.text()
})
.then(data => {
  console.log('📡 Response body:', data)
  try {
    const json = JSON.parse(data)
    console.log('📡 Parsed JSON:', json)
  } catch (e) {
    console.log('📡 Not JSON:', data)
  }
})
.catch(error => {
  console.error('❌ Error:', error)
})
