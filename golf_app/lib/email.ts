import nodemailer from 'nodemailer'

/**
 * 매 요청 시점(런타임)에 transporter를 생성합니다.
 * SMTP_* (다른 앱과 동일) 또는 EMAIL_* 환경 변수 지원.
 */
function getTransporter() {
  const user = process.env.SMTP_USER || process.env.EMAIL_USER
  const pass = process.env.SMTP_PASS || process.env.EMAIL_APP_PASSWORD
  if (!user || !pass) {
    throw new Error('SMTP_USER/SMTP_PASS 또는 EMAIL_USER/EMAIL_APP_PASSWORD 환경 변수를 설정해 주세요.')
  }
  const host = process.env.SMTP_HOST || 'smtp.naver.com'
  // Render 등 클라우드에서는 465 아웃바운드가 막혀 있어 587(STARTTLS) 사용
  const defaultPort =
    process.env.RENDER === 'true' ? 587 : 465
  const port = parseInt(
    process.env.SMTP_PORT || process.env.EMAIL_PORT || String(defaultPort),
    10
  )
  const secure =
    port === 465 &&
    (process.env.SMTP_SECURE === undefined || process.env.SMTP_SECURE === 'true')
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: 25000,
    greetingTimeout: 25000,
    ...(port === 587 ? { requireTLS: true } : {}),
  })
}

export async function sendPasswordResetEmail(to: string, resetLink: string) {
  const appName = '캐디BAE'
  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #00ACEE;">${appName} 비밀번호 재설정</h2>
      <p>비밀번호 재설정을 요청하셨습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정해 주세요.</p>
      <p style="margin: 24px 0;">
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background: #00ACEE; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">비밀번호 재설정하기</a>
      </p>
      <p style="color: #666; font-size: 14px;">링크는 1시간 동안 유효합니다. 요청하지 않으셨다면 이 메일을 무시해 주세요.</p>
      <p style="color: #999; font-size: 12px;">— ${appName}</p>
    </div>
  `
  const transporter = getTransporter()
  const from =
    process.env.SMTP_FROM ||
    process.env.EMAIL_USER ||
    process.env.SMTP_USER ||
    `"${appName}" <noreply@example.com>`
  await transporter.sendMail({
    from,
    to,
    subject: `[${appName}] 비밀번호 재설정 링크`,
    html,
  })
}
