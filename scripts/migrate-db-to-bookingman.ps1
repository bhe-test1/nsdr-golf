# MongoDB 이전 스크립트 (기존 nsdr-golf → 새 bookingman)
# PATH 없이도 동작하도록 MongoDB Database Tools 전체 경로 사용

$toolsBin = "C:\Users\닉스온소프트\Downloads\mongodb-database-tools-windows-x86_64-100.14.1\mongodb-database-tools-windows-x86_64-100.14.1\bin"
$oldUri = "mongodb+srv://golf_app:admin123%21@nsdr-golf.zncxh4f.mongodb.net/?retryWrites=true&w=majority"
$newUri = "mongodb+srv://bhe0822_db_user:dqpYJIWTM7QL5S7N@bookingman.mrx8bpd.mongodb.net/?retryWrites=true&w=majority"
$backupDir = ".\mongodb_backup"

Write-Host "=== 1단계: 기존 DB 백업 (mongodump) ===" -ForegroundColor Cyan
& "$toolsBin\mongodump.exe" --uri=$oldUri --out=$backupDir
if ($LASTEXITCODE -ne 0) {
    Write-Host "백업 실패. 기존 연결 정보를 확인하세요." -ForegroundColor Red
    exit 1
}

Write-Host "`n=== 2단계: 새 클러스터로 복원 (mongorestore) ===" -ForegroundColor Cyan
& "$toolsBin\mongorestore.exe" --uri=$newUri $backupDir
if ($LASTEXITCODE -ne 0) {
    Write-Host "복원 실패. 새 Atlas 연결 정보와 네트워크 접근을 확인하세요." -ForegroundColor Red
    exit 1
}

Write-Host "`n이전 완료. 백업 폴더 삭제하려면: Remove-Item -Recurse -Force mongodb_backup" -ForegroundColor Green
