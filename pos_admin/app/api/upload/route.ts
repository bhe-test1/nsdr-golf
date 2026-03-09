import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const userName = formData.get('userName') as string || '사용자'
    const photoIndex = formData.get('photoIndex') as string || '1'

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다.' }, { status: 400 })
    }

    // 파일 확장자 확인
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '이미지 파일만 업로드할 수 있습니다.' }, { status: 400 })
    }

    // 파일 확장자 추출
    const fileExtension = file.name.split('.').pop() || 'png'
    
    // 사용자 이름 정리 ("님" 제거, 공백은 유지)
    const cleanUserName = userName.replace(/님$/, '')
    
    // 파일명 생성 (사용자이름_매장사진번호.확장자)
    const fileName = `${cleanUserName}_매장사진${photoIndex}.${fileExtension}`
    const key = `store/${fileName}`

    // 파일을 버퍼로 변환
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // R2에 업로드
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME || 'nsdr-golf',
      Key: key,
      Body: buffer,
      ContentType: file.type,
    })

    await s3Client.send(command)

    // 공개 URL 생성 (R2 커스텀 도메인 또는 공개 엔드포인트 사용)
    const publicUrl = process.env.R2_PUBLIC_URL 
      ? `${process.env.R2_PUBLIC_URL}/${key}`
      : `https://pub-${process.env.R2_ACCOUNT_ID}.r2.dev/${key}`

    return NextResponse.json({ 
      success: true, 
      url: publicUrl,
      key: key 
    })
  } catch (error) {
    console.error('R2 업로드 오류:', error)
    return NextResponse.json(
      { error: '파일 업로드에 실패했습니다.' },
      { status: 500 }
    )
  }
}
