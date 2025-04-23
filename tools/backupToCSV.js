const fs = require('fs');
const path = require('path');
const { parse } = require('json2csv');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// ✅ 인증용 서비스 계정 키 불러오기
const serviceAccount = require('../tools/serviceAccountKey.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

/**
 * 현재 날짜를 YYYY-MM-DD 형식으로 반환
 */
function getTodayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 특정 Firestore 컬렉션을 CSV로 백업
 */
async function exportCollectionToCSV(collectionName) {
  try {
    const snapshot = await db.collection(collectionName).get();
    if (snapshot.empty) {
      console.log(`📭 ${collectionName} 컬렉션에 데이터가 없습니다.`);
      return;
    }

    const records = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    const csv = parse(records);
    const dateStr = getTodayDateString();
    const outputPath = path.join(__dirname, `../backup/${collectionName}_backup_${dateStr}.csv`);

    // ✅ backup 폴더 없으면 생성
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    fs.writeFileSync(outputPath, csv);
    console.log(`✅ '${collectionName}' 컬렉션을 CSV로 백업했습니다.`);
    console.log(`📂 경로: ${outputPath}`);
  } catch (err) {
    console.error(`❌ 백업 실패 (${collectionName}):`, err);
  }
}

// 원하는 컬렉션명만 바꿔서 실행
exportCollectionToCSV('cameras');
