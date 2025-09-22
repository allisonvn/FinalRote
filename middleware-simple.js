// Middleware simplificado para teste
const { NextResponse } = require('next/server')

function middleware(request) {
  const response = NextResponse.next()
  return response
}

module.exports = { middleware }
