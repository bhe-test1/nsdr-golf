const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    // 비밀번호 암호화
    const password = '1234';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // UUID 생성 (간단한 버전)
    const uuid = () => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    };
    
    const adminId = uuid();
    const email = 'bhehappy@naver.com';
    const name = '최고 관리자';
    
    // SQL INSERT 쿼리 생성
    const sql = `INSERT INTO admin (id, email, password, name, created_at, updated_at) 
VALUES ('${adminId}', '${email}', '${hashedPassword}', '${name}', NOW(), NOW());`;
    
    console.log('=== Admin 테이블 생성 및 데이터 삽입 ===\n');
    console.log('1. 먼저 HeidiSQL에서 다음 SQL을 실행하세요:\n');
    console.log('CREATE TABLE IF NOT EXISTS `admin` (');
    console.log('  `id` VARCHAR(36) NOT NULL PRIMARY KEY,');
    console.log('  `email` VARCHAR(255) NOT NULL UNIQUE,');
    console.log('  `password` VARCHAR(255) NOT NULL,');
    console.log('  `name` VARCHAR(255) NOT NULL,');
    console.log('  `phone` VARCHAR(20) NULL,');
    console.log('  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,');
    console.log('  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,');
    console.log('  INDEX `idx_email` (`email`)');
    console.log(') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;\n');
    
    console.log('2. 그 다음 다음 INSERT 쿼리를 실행하세요:\n');
    console.log(sql);
    console.log('\n=== 정보 ===');
    console.log(`이메일: ${email}`);
    console.log(`비밀번호: ${password}`);
    console.log(`암호화된 비밀번호: ${hashedPassword.substring(0, 30)}...`);
    
  } catch (error) {
    console.error('에러 발생:', error);
  }
}

createAdmin();

