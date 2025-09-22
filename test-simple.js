// Teste simples sem Supabase
const http = require('http');

const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end('<h1>Teste Funcionando!</h1><p>Servidor está rodando normalmente.</p>');
});

server.listen(3001, () => {
  console.log('Servidor teste rodando na porta 3001');
});
