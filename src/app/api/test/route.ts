import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    
    return NextResponse.json({
      success: true,
      message: 'Test endpoint working',
      received: data,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Test error', details: error.message },
      { status: 500 }
    )
  }
}
