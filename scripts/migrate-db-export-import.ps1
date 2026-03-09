# MongoDB 이전: mongoexport + mongoimport 방식
# DB/컬렉션별로 JSON 내보내기 → 새 클러스터로 가져오기

$toolsBin = Join-Path $env:USERPROFILE "Downloads\mongodb-database-tools-windows-x86_64-100.14.1\mongodb-database-tools-windows-x86_64-100.14.1\bin"
if (-not (Test-Path "$toolsBin\mongoexport.exe")) {
    Write-Host "MongoDB Database Tools를 찾을 수 없습니다: $toolsBin" -ForegroundColor Red
    Write-Host "다운로드: https://www.mongodb.com/try/download/database-tools" -ForegroundColor Yellow
    exit 1
}

$oldBase = "mongodb+srv://golf_app:admin123%21@nsdr-golf.zncxh4f.mongodb.net"
$newBase = "mongodb+srv://bhe0822_db_user:dqpYJIWTM7QL5S7N@bookingman.mrx8bpd.mongodb.net"
$exportDir = ".\mongo_export_backup"
New-Item -ItemType Directory -Force -Path $exportDir | Out-Null

# DB별 컬렉션 목록 (스키마 기준)
$dbCollections = @{
    "golf_app"    = @("users", "stores", "favorites", "notices", "posts", "comments")
    "pos_admin"   = @("store_owner", "owners", "users", "reservations", "login", "notices", "price")
    "power_admin" = @("admin", "store_owner", "store_mapping", "notices", "activity_logs")
}

$failed = @()
foreach ($db in $dbCollections.Keys) {
    $collections = $dbCollections[$db]
    $oldUri = "$oldBase/$db"
    $newUri = "$newBase/$db"
    Write-Host "`n=== DB: $db ===" -ForegroundColor Cyan
    foreach ($coll in $collections) {
        $outFile = Join-Path $exportDir "${db}_${coll}.json"
        Write-Host "  컬렉션: $coll ... " -NoNewline
        & "$toolsBin\mongoexport.exe" --uri=$oldUri --collection=$coll --out=$outFile --jsonArray 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "내보내기 건너뜀 (없거나 오류)" -ForegroundColor Yellow
            if (Test-Path $outFile) { Remove-Item $outFile -Force }
            continue
        }
        # MongoDB 확장 JSON($oid,$date)은 PowerShell ConvertFrom-Json으로 파싱 불가 → 건수만 추정
        $raw = Get-Content $outFile -Raw -ErrorAction SilentlyContinue
        $count = if ($raw) { ([regex]::Matches($raw, '"\$oid"')).Count } else { 0 }
        Write-Host "내보냄 ($count 건) " -NoNewline
        & "$toolsBin\mongoimport.exe" --uri=$newUri --collection=$coll --file=$outFile --jsonArray 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "가져오기 실패" -ForegroundColor Red
            $failed += "$db.$coll"
        } else {
            Write-Host "가져옴" -ForegroundColor Green
        }
    }
}

Write-Host "`n=== 완료 ===" -ForegroundColor Cyan
Write-Host "내보내기 파일 위치: $exportDir" -ForegroundColor Gray
if ($failed.Count -gt 0) {
    Write-Host "실패한 컬렉션: $($failed -join ', ')" -ForegroundColor Red
}
