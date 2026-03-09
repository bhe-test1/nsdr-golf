# DB 테이블(컬렉션) 이전 방법

**컬렉션을 하나하나 만들 필요 없습니다.**  
기존 DB를 통째로 백업한 뒤 새 클러스터에 복원하면, **DB 이름·컬렉션·문서가 그대로** 만들어집니다.

---

## 1. MongoDB Database Tools 설치 (한 번만)

1. https://www.mongodb.com/try/download/database-tools 접속
2. **Version**: 최신, **Platform**: Windows, **Package**: zip
3. 다운로드 후 압축 해제
4. `bin` 폴더 경로를 **시스템 환경 변수 Path**에 추가  
   (예: `C:\Program Files\MongoDB\Server\7.0\bin` 또는 풀어 둔 경로의 `bin`)

설치 확인:
```powershell
mongodump --version
mongorestore --version
```

---

## 2. 이전 순서 (두 단계)

| 단계 | 하는 일 |
|------|----------|
| **1) mongodump** | 기존 클러스터에서 DB 전체를 로컬 폴더로 백업 (컬렉션 + 데이터) |
| **2) mongorestore** | 그 폴더를 새 bookingman 클러스터에 복원 → 컬렉션이 자동 생성됨 |

---

## 3. 스크립트로 한 번에 실행

프로젝트 루트에서:

```powershell
cd "c:\Users\닉스온소프트\Desktop\닉스온골프\scripts"
.\migrate-db-to-bookingman.ps1
```

실행 정책 오류가 나면:
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```
한 번 실행한 뒤 다시 스크립트를 실행하세요.

---

## 4. 수동으로 할 때 (명령어만)

**기존 클러스터 백업**
```powershell
mongodump --uri="mongodb+srv://golf_app:admin123%21@nsdr-golf.zncxh4f.mongodb.net/?retryWrites=true&w=majority" --out=./mongodb_backup
```

**새 클러스터로 복원**
```powershell
mongorestore --uri="mongodb+srv://bhe0822_db_user:dqpYJIWTM7QL5S7N@bookingman.mrx8bpd.mongodb.net/?retryWrites=true&w=majority" ./mongodb_backup
```

---

## 5. 확인

- Atlas **bookingman** 클러스터 → **Database** → **Browse Collections**
- `golf_app`, `pos_admin`, `power_admin` 등 기존 DB와 컬렉션이 그대로 보이면 이전 완료입니다.

---

## 6. 방법 2: mongoexport + mongoimport (컬렉션별 JSON)

컬렉션마다 JSON으로 내보낸 뒤 새 DB에 넣는 방식입니다. **추천 2위**로, 컬렉션 단위로 확인하면서 옮기고 싶을 때 쓰면 좋습니다.

**스크립트 한 번에 실행 (DB/컬렉션 자동 처리):**
```powershell
cd "c:\Users\닉스온소프트\Desktop\닉스온골프\scripts"
.\migrate-db-export-import.ps1
```

- **golf_app**: users, stores, favorites, notices, posts, comments  
- **pos_admin**: store_owner, owners, users, reservations, login, notices, price  
- **power_admin**: admin, store_owner, store_mapping, notices, activity_logs  

위 컬렉션들을 자동으로 export → import 합니다. 없거나 이름이 다른 컬렉션은 건너뜁니다.  
내보낸 파일은 `scripts\mongo_export_backup` 폴더에 `DB이름_컬렉션이름.json` 형식으로 남습니다.

**수동으로 한 컬렉션만 할 때:**
```powershell
# 내보내기 (--jsonArray 로 배열 형식)
mongoexport --uri="mongodb+srv://유저:비번@기존클러스터.mongodb.net/golf_app" --collection=comments --out=comments.json --jsonArray

# 새 DB에 넣기
mongoimport --uri="mongodb+srv://새유저:새비번@bookingman.mrx8bpd.mongodb.net/golf_app" --collection=comments --file=comments.json --jsonArray
```

---

## 7. 주의사항

- **기존 Atlas IP 접근**: 덤프하는 PC IP가 기존 클러스터(nsdr-golf) Network Access에 있어야 합니다.
- **새 Atlas IP 접근**: 같은 PC IP가 새 클러스터(bookingman) Network Access에 있어야 합니다.
- 비밀번호를 바꾼 적이 있으면 스크립트/명령어의 `--uri` 안의 비밀번호를 현재 값으로 수정한 뒤 실행하세요.
