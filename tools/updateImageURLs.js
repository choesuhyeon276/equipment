// tools/updateImageURLs.js
require('dotenv').config();
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');
const { getStorage, ref, getDownloadURL } = require('firebase/storage');

// Firebase 환경변수로부터 설정 가져오기
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const updateImageURLs = async () => {
  const cameraRef = collection(db, 'cameras');
  const snapshot = await getDocs(cameraRef);

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.image && !data.imageURL) {

      try {
        const imageRef = ref(storage, data.image); // ✅ 실제 경로 사용
      const url = await getDownloadURL(imageRef);

      await updateDoc(doc(db, 'cameras', docSnap.id), {
        imageURL: url
      });

        console.log(`✅ ${docSnap.id} → 이미지 URL 업데이트 완료`);
      } catch (error) {
        console.error(`❌ ${docSnap.id} → URL 실패:`, error.message);
      }
    }
  }

  console.log('🎉 전체 이미지 업데이트 완료!');
  process.exit();
};

updateImageURLs();
