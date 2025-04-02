// tools/forceUpdateImageURL.js
require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

// Firebase 설정
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const forceUpdateImageURL = async () => {
  const cameraRef = collection(db, 'cameras');
  const snapshot = await getDocs(cameraRef);

  console.log(`📦 문서 총 개수: ${snapshot.docs.length}`);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const cameraDocRef = doc(db, 'cameras', docSnap.id);

    if (data.image) {
      try {
        await updateDoc(cameraDocRef, {
          imageURL: data.image, // ✅ 항상 덮어쓰기
        });
        console.log(`✅ ${docSnap.id} → imageURL 필드 덮어쓰기 완료`);
      } catch (err) {
        console.error(`❌ ${docSnap.id} → 업데이트 실패:`, err.message);
      }
    } else {
      console.log(`⚠️ ${docSnap.id} → image 필드 없음, 건너뜀`);
    }
  }

  console.log('🎉 모든 문서 업데이트 완료!');
  process.exit();
};

forceUpdateImageURL();
