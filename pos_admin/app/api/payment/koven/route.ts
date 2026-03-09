import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

/** KOVEN 결제 요청용 해시 생성 (규격: message = orderno+orderdt+ordertm+buyReqamt, secretKey = API_KEY) */
function createCheckHash(
  orderno: string,
  orderdt: string,
  ordertm: string,
  buyReqamt: string,
  apiKey: string
): string {
  const message = orderno + orderdt + ordertm + buyReqamt
  const hmac = crypto.createHmac('sha256', apiKey)
  hmac.update(message, 'utf8')
  return hmac.digest('base64')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      amount,
      memberName,
      roomNumber,
      playOption,
      peopleCount,
      startTime,
      endTime,
      paymentType,
      paymentMethod,
      cancelUrl: bodyCancelUrl,
      returnUrl: bodyReturnUrl,
    } = body as {
      amount: number
      memberName?: string
      roomNumber?: number
      playOption?: string
      peopleCount?: number
      startTime?: string
      endTime?: string
      paymentType?: string
      paymentMethod?: string
      cancelUrl?: string
      returnUrl?: string
    }

    const apiKey = process.env.KOVEN_API_KEY
    const mid = process.env.KOVEN_MID
    const returnUrl = (bodyReturnUrl || process.env.KOVEN_RETURN_URL || `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/payment/return`).trim()
    const cancelUrl = (bodyCancelUrl || process.env.KOVEN_CANCEL_URL || '').trim()
    const pgBaseUrl = process.env.KOVEN_PG_URL || 'https://dev-epay.kovanpay.com'

    if (!apiKey || !mid) {
      return NextResponse.json(
        { error: 'KOVEN_API_KEY 또는 KOVEN_MID가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const amt = Math.round(Number(amount) || 0)
    if (amt <= 0) {
      return NextResponse.json({ error: '결제 금액이 올바르지 않습니다.' }, { status: 400 })
    }

    const now = new Date()
    const orderdt =
      [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('') // YYYYMMDD 로컬
    const ordertm =
      [now.getHours(), now.getMinutes(), now.getSeconds()].map((n) => String(n).padStart(2, '0')).join('') // HHMMSS 로컬
    const orderno = `R${roomNumber ?? 0}_${orderdt}${ordertm}_${Math.random().toString(36).slice(2, 8)}`.slice(0, 20) // 규격 Max 20, 해시와 동일값 사용
    const buyReqamt = String(amt)

    const checkHash = createCheckHash(orderno, orderdt, ordertm, buyReqamt, apiKey)

    const payGroup = 'GEP'
    const payType = paymentType === 'card' ? 'CC' : paymentType === 'cash' ? 'CS' : 'CC'

    const formData: Record<string, string> = {
      mid,
      rUrl: returnUrl,
      rMethod: 'POST',
      payGroup,
      payType,
      buyItemnm: `${roomNumber ?? ''}번방 이용등록`,
      buyReqamt,
      buyItemcd: `ROOM${roomNumber ?? 0}`,
      buyernm: (memberName || '고객').slice(0, 50),
      orderno,
      orderdt,
      ordertm,
      checkHash,
      reserved01: JSON.stringify({
        roomNumber,
        playOption,
        peopleCount,
        startTime,
        endTime,
        paymentType,
        paymentMethod,
      }),
    }
    if (cancelUrl) {
      formData.cUrl = cancelUrl
      formData.cancelUrl = cancelUrl
    }

    const pgUrl = `${pgBaseUrl}/paypage/common/mainFrame.pay`

    return NextResponse.json({ pgUrl, formData })
  } catch (e) {
    console.error('KOVEN 결제 요청 오류:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '결제 요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
