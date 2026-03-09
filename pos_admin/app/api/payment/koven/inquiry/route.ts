import { NextRequest, NextResponse } from 'next/server'

/**
 * KOVEN 결제내역 조회
 *
 * [요청]
 * - tid/orderno 알고 있을 때: { mid, payGroup, paymethod, tid? | orderno?, checkHash?, reserved01? }
 * - 모를 때: { mid, payGroup, paymethod, approvdt, approv_no, approv_amt, checkHash?, reserved01? }
 *
 * [응답 예시]
 * {
 *   "RESULT_CODE": "EC0000",
 *   "RESULT_MSG": "성공",
 *   "RESULT_DET_CODE": "EC0000",
 *   "RESULT_DET_MSG": "성공",
 *   "data": [
 *     {
 *       "PAY_METHOD": "CC", "TID": "220310130423508",
 *       "ORDERNO": "ORDER220310000005", "RESERVED01": "2475", "RESERVED02": "",
 *       "MID": "M20201104113435", "BUY_ITEMNM": "테스트상품",
 *       "TRANS_STATUS_NM": "승인", "TRANS_STATUS": "20",
 *       "APPROAMT": 1004, "CANCEL_AMT": -500,
 *       "APPRODT": "2022-03-10 19:55:59", "CANCEL_DT": "2022-03-10 20:00:34"
 *     }
 *   ]
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as Record<string, string>
    const mid = process.env.KOVEN_MID
    const pgBaseUrl = process.env.KOVEN_PG_URL || 'https://dev-epay.kovanpay.com'

    if (!mid) {
      return NextResponse.json(
        { error: 'KOVEN_MID가 설정되지 않았습니다.' },
        { status: 500 }
      )
    }

    const hasTidOrOrderno = body.tid ?? body.orderno
    const hasApproval = body.approvdt && body.approv_no && body.approv_amt

    if (!hasTidOrOrderno && !hasApproval) {
      return NextResponse.json(
        { error: 'tid/orderno 또는 approvdt, approv_no, approv_amt 중 하나를 입력해주세요.' },
        { status: 400 }
      )
    }

    const payload: Record<string, string> = {
      mid,
      payGroup: body.payGroup ?? 'GEP',
      paymethod: body.paymethod ?? 'CC',
      checkHash: body.checkHash ?? '',
      reserved01: body.reserved01 ?? '',
    }

    if (body.tid) payload.tid = body.tid
    if (body.orderno) payload.orderno = body.orderno
    if (body.approvdt) payload.approvdt = body.approvdt
    if (body.approv_no) payload.approv_no = body.approv_no
    if (body.approv_amt) payload.approv_amt = body.approv_amt

    const inquiryUrl = process.env.KOVEN_INQUIRY_URL || `${pgBaseUrl}/api/inquiry`
    const res = await fetch(inquiryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data)
  } catch (e) {
    console.error('KOVEN 결제내역 조회 오류:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : '조회 중 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}
