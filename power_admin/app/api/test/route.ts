import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const info = {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseUrlPreview: process.env.DATABASE_URL 
        ? `${process.env.DATABASE_URL.substring(0, 20)}...` 
        : 'not set',
      nodeEnv: process.env.NODE_ENV,
    }

    // Prisma 연결 테스트
    try {
      await prisma.$connect()
      await prisma.$disconnect()
      return NextResponse.json({
        success: true,
        message: 'Prisma 연결 성공',
        info,
      })
    } catch (prismaError: any) {
      return NextResponse.json({
        success: false,
        message: 'Prisma 연결 실패',
        error: prismaError.message,
        stack: process.env.NODE_ENV === 'development' ? prismaError.stack : undefined,
        info,
      }, { status: 500 })
    }
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: '테스트 실패',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 })
  }
}

