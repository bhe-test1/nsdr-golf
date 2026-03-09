-- 1. admin 테이블 생성
CREATE TABLE IF NOT EXISTS `admin` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. 관리자 계정 생성 (비밀번호: 1234)
INSERT INTO admin (id, email, password, name, created_at, updated_at) 
VALUES (
  '2e52f09b-1d1d-441e-83c2-d8fe9e756b6d', 
  'bhehappy@naver.com', 
  '$2b$10$PoJC/u51fm4v8u2n8cMltO/QEIbBNURo4xcmUhXI7qCb7wPIFlWfy', 
  '최고 관리자', 
  NOW(), 
  NOW()
);

