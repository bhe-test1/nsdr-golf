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

/** golf_app 단독 KOVEN 결제 요청 (pos_admin 미사용) */
function buildKovenPayment(body: {
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
}) {
  const apiKey = process.env.KOVEN_API_KEY
  const mid = process.env.KOVEN_MID
  const baseUrl =
    process.env.NEXTAUTH_URL ||
    process.env.RENDER_EXTERNAL_URL ||
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
    'http://localhost:3001'
  const returnUrl = (
    body.returnUrl ||
    process.env.KOVEN_RETURN_URL ||
    `${baseUrl}/payment/return`
  ).trim()
  const cancelUrl = (body.cancelUrl || process.env.KOVEN_CANCEL_URL || '').trim()
  const pgBaseUrl = process.env.KOVEN_PG_URL || 'https://dev-epay.kovanpay.com'

  if (!apiKey || !mid) {
    return { error: 'KOVEN_API_KEY 또는 KOVEN_MID가 설정되지 않았습니다.' }
  }

  const amt = Math.round(Number(body.amount) || 0)
  if (amt <= 0) {
    return { error: '결제 금액이 올바르지 않습니다.', status: 400 as const }
  }

  const now = new Date()
  const orderdt = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
  ].join('')
  const ordertm = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((n) => String(n).padStart(2, '0'))
    .join('')
  const orderno = `R${body.roomNumber ?? 0}_${orderdt}${ordertm}_${Math.random().toString(36).slice(2, 8)}`.slice(0, 20)
  const buyReqamt = String(amt)

  const checkHash = createCheckHash(orderno, orderdt, ordertm, buyReqamt, apiKey)

  const payGroup = 'GEP'
  const payType =
    body.paymentType === 'card' ? 'CC' : body.paymentType === 'cash' ? 'CS' : 'CC'

  const formData: Record<string, string> = {
    mid,
    rUrl: returnUrl,
    rMethod: 'POST',
    payGroup,
    payType,
    buyItemnm: `${body.roomNumber ?? ''}번방 이용등록`,
    buyReqamt,
    buyItemcd: `ROOM${body.roomNumber ?? 0}`,
    buyernm: (body.memberName || '고객').slice(0, 50),
    orderno,
    orderdt,
    ordertm,
    checkHash,
    reserved01: JSON.stringify({
      roomNumber: body.roomNumber,
      playOption: body.playOption,
      peopleCount: body.peopleCount,
      startTime: body.startTime,
      endTime: body.endTime,
      paymentType: body.paymentType,
      paymentMethod: body.paymentMethod,
    }),
  }
  if (cancelUrl) {
    formData.cUrl = cancelUrl
    formData.cancelUrl = cancelUrl
  }

  const pgUrl = `${pgBaseUrl}/paypage/common/mainFrame.pay`
  return { pgUrl, formData }
}

/**
 * KOVEN 결제: pos_admin 프록시 시도 → 실패 시 golf_app 단독 결제
 * pos_admin 미실행 시에도 golf_app .env의 KOVEN_MID, KOVEN_API_KEY 등으로 결제 가능
 */
export async function POST(request: NextRequest) {
  let body: {
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

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: '요청 본문이 올바르지 않습니다.' },
      { status: 400 }
    )
  }

  const baseUrl = process.env.POS_ADMIN_API_URL || ''

  // 1) pos_admin 프록시 시도 (URL이 있고 연결 가능할 때만)
  if (baseUrl) {
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, '')}/api/payment/koven`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: body.amount,
          memberName: body.memberName,
          roomNumber: body.roomNumber,
          playOption: body.playOption,
          peopleCount: body.peopleCount,
          startTime: body.startTime,
          endTime: body.endTime,
          paymentType: body.paymentType,
          paymentMethod: body.paymentMethod,
          cancelUrl: body.cancelUrl,
          returnUrl: body.returnUrl,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        return NextResponse.json(data)
      }
      return NextResponse.json(
        { error: (data as { error?: string }).error || '결제 요청에 실패했습니다.' },
        { status: res.status }
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      const isConnectionError =
        /fetch failed|ECONNREFUSED|ENOTFOUND|ECONNRESET|ETIMEDOUT/i.test(msg) || !msg
      if (isConnectionError) {
        console.warn('KOVEN pos_admin 프록시 연결 실패, golf_app 단독 결제로 진행:', msg)
      } else {
        console.error('KOVEN 결제 프록시 오류:', e)
        return NextResponse.json(
          { error: msg || '결제 요청 처리 중 오류가 발생했습니다.' },
          { status: 500 }
        )
      }
    }
  }

  // 2) golf_app 단독 결제 (pos_admin 미사용 또는 연결 실패 시)
  const result = buildKovenPayment(body)
  if ('error' in result) {
    const status = 'status' in result ? result.status : 500
    return NextResponse.json({ error: result.error }, { status })
  }
  return NextResponse.json(result)
}
