import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

// Firebase 구성 (보안을 위해 환경 변수 사용)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Firebase 앱 초기화 (중복 방지)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Firestore 및 Storage 인스턴스 생성
const db = getFirestore(app);
const storage = getStorage(app);

// 이미지를 Firebase Storage에서 가져오는 함수
export const getImageURL = async (imagePath) => {
  try {
    const imageRef = ref(storage, imagePath);
    const url = await getDownloadURL(imageRef);
    console.log(`Image URL for ${imagePath}:`, url);  // 경로와 함께 URL 로깅
    return url;
  } catch (error) {
    console.error("Error fetching image URL:", error);
    return null;
  }
};

// 필요한 요소들 export
export { 
  db, 
  storage 
};

export default app;