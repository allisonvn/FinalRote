import { NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET() {
  try {
    const sdkPath = join(process.cwd(), 'public', 'rotafinal-sdk.js')
    const sdkContent = readFileSync(sdkPath, 'utf-8')

    return new NextResponse(sdkContent, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error serving SDK:', error)
    return new NextResponse('SDK not found', { status: 404 })
  }
}