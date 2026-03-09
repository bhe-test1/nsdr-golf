const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = 'bhe@naver.com';
    const password = '1111';
    const name = '관리자';
    
    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 관리자 생성
    const admin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name,
        status: 'active',
      },
    });
    
    console.log('=== 관리자 계정 생성 완료 ===');
    console.log(`이메일: ${admin.email}`);
    console.log(`이름: ${admin.name}`);
    console.log(`비밀번호: ${password}`);
    console.log(`ID: ${admin.id}`);
    
  } catch (error) {
    if (error.code === 'P2002') {
      console.error('에러: 이미 존재하는 이메일입니다.');
    } else {
      console.error('에러 발생:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();

