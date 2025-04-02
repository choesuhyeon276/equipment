// tools/removeImageField.js
require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, deleteField } = require('firebase/firestore');

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

const removeImageField = async () => {
  const cameraRef = collection(db, 'cameras');
  const snapshot = await getDocs(cameraRef);

  console.log(`📦 전체 문서 수: ${snapshot.docs.length}`);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const docRef = doc(db, 'cameras', docSnap.id);

    if (data.image) {
      try {
        await updateDoc(docRef, {
          image: deleteField(), // ✅ image 필드 삭제
        });
        console.log(`🧹 ${docSnap.id} → image 필드 삭제 완료`);
      } catch (err) {
        console.error(`❌ ${docSnap.id} → 삭제 실패:`, err.message);
      }
    } else {
      console.log(`ℹ️ ${docSnap.id} → image 필드 없음`);
    }
  }

  console.log('🎉 모든 image 필드 삭제 완료!');
  process.exit();
};

removeImageField();
