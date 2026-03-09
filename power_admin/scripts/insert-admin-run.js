/**
 * 최고 관리자 계정 생성/업데이트 스크립트
 * 기본 DB 접속 정보(docker-compose 기준):
 *   host: localhost
 *   port: 3306
 *   user: root
 *   password: rootpassword
 *   database: golf_app
 *
 * 필요 시 환경변수로 덮어쓰기:
 *   DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
 */

const mysql = require('mysql2/promise')
const bcrypt = require('bcryptjs')
const { URL } = require('url')
require('dotenv').config()

async function main() {
  const dbConfig = buildDbConfig()

  const email = 'bhe20030822@gmail.com'
  const plainPassword = '1234'
  const name = '최고 관리자'
  const phone = '010-1234-5678'
  const id = cryptoUUID()

  let conn
  try {
    console.log(`DB 연결 시도: ${dbConfig.user}@${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`)
    conn = await mysql.createConnection(dbConfig)
    console.log('DB 연결 성공\n')

    const hashed = await bcrypt.hash(plainPassword, 10)

    // admin 테이블 존재 확인
    const [tables] = await conn.query(
      "SHOW TABLES LIKE 'admin'"
    )
    if (tables.length === 0) {
      throw new Error("admin 테이블이 존재하지 않습니다. 먼저 테이블을 생성하세요.")
    }

    // 기존 이메일 확인
    const [rows] = await conn.execute('SELECT id FROM admin WHERE email = ?', [email])
    if (rows.length > 0) {
      // 업데이트
      await conn.execute(
        `UPDATE admin
         SET password = ?, name = ?, phone = ?, updated_at = NOW()
         WHERE email = ?`,
        [hashed, name, phone, email]
      )
      console.log('✅ 기존 계정 비밀번호/정보가 업데이트되었습니다.')
      console.log(`ID: ${rows[0].id}`)
    } else {
      // 신규 삽입
      await conn.execute(
        `INSERT INTO admin (id, email, password, name, phone, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, NOW(), NOW())`,
        [id, email, hashed, name, phone]
      )
      console.log('✅ 새 최고 관리자 계정이 생성되었습니다.')
      console.log(`ID: ${id}`)
    }

    console.log('\n=== 계정 정보 ===')
    console.log(`이메일: ${email}`)
    console.log(`비밀번호(평문): ${plainPassword}`)
    console.log(`해시: ${hashed.substring(0, 30)}...`)
  } catch (err) {
    console.error('❌ 에러:', err.message)
  } finally {
    if (conn) {
      await conn.end()
      console.log('DB 연결 종료')
    }
  }
}

function cryptoUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function buildDbConfig() {
  // 1) DATABASE_URL 우선 사용 (예: mysql://user:pass@host:3306/dbname)
  const url = process.env.DATABASE_URL
  if (url) {
    try {
      const u = new URL(url)
      return {
        host: u.hostname,
        port: parseInt(u.port || '3306', 10),
        user: decodeURIComponent(u.username),
        password: decodeURIComponent(u.password),
        database: u.pathname.replace('/', '').split('?')[0],
      }
    } catch (e) {
      console.warn('DATABASE_URL 파싱 실패, DB_* 환경변수로 시도합니다.')
    }
  }

  // 2) DB_* 환경변수로 폴백
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    database: process.env.DB_NAME || 'golf_app',
  }
}

main()

