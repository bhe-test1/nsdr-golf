const { MongoClient } = require('mongodb');
const path = require('path');

// .env.local 또는 .env 파일에서 환경 변수 로드
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

async function deleteCollections() {
  const client = new MongoClient(DATABASE_URL);
  
  try {
    await client.connect();
    console.log('MongoDB에 연결되었습니다.');
    
    // 데이터베이스 이름 추출 (URL에서)
    const dbName = DATABASE_URL.split('/').pop().split('?')[0];
    const db = client.db(dbName);
    
    console.log(`데이터베이스: ${dbName}`);
    console.log('유지할 컬렉션: admin, store_owner\n');
    
    // 삭제할 컬렉션 목록 (admin과 store_owner 제외)
    const collectionsToDelete = ['favorites', 'notices', 'reservations', 'stores', 'users'];
    
    console.log('삭제할 컬렉션:');
    for (const collectionName of collectionsToDelete) {
      try {
        const collection = db.collection(collectionName);
        const count = await collection.countDocuments();
        console.log(`\n  - ${collectionName} (문서 수: ${count})`);
        
        if (count > 0) {
          const result = await collection.deleteMany({});
          console.log(`    ✓ ${result.deletedCount}개의 문서가 삭제되었습니다.`);
        } else {
          console.log(`    ✓ 컬렉션이 이미 비어있습니다.`);
        }
        
        // 컬렉션 자체도 삭제
        try {
          await collection.drop();
          console.log(`    ✓ ${collectionName} 컬렉션이 삭제되었습니다.`);
        } catch (error) {
          if (error.codeName === 'NamespaceNotFound') {
            console.log(`    ✓ ${collectionName} 컬렉션이 이미 존재하지 않습니다.`);
          } else {
            throw error;
          }
        }
      } catch (error) {
        console.error(`    ✗ ${collectionName} 컬렉션 처리 중 오류:`, error.message);
      }
    }
    
    console.log('\n✓ 작업이 완료되었습니다!');
    console.log('admin과 store_owner 컬렉션은 유지되었습니다.');
    
  } catch (error) {
    console.error('오류 발생:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\nMongoDB 연결이 종료되었습니다.');
  }
}

deleteCollections()
  .catch((error) => {
    console.error('스크립트 실행 중 오류:', error);
    process.exit(1);
  });

