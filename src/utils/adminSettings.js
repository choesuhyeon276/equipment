// src/utils/adminSettings.js
import { db, doc, getDoc, setDoc, serverTimestamp } from '../firebase/firebaseConfig';
import { onSnapshot } from 'firebase/firestore';

export const DEFAULT_SETTINGS = {
  adminEmails: ['choesuhyeon276@gmail.com'],
  adminName: 'DKit 관리자',
  adminPhone: '010-0000-0000',
  kakaoOpenChatUrl: '',
  notesCards: [
    { title: '대여일', color: '#00bcd4', content: '• 대여일 1일 전에는 신청하기\n• 당일 대여 불가\n• 평일 9:00 - 17:00 동안 장비 수령 가능' },
    { title: '반납시', color: '#f44336', content: '마이페이지에 현재 대여 장비란에\n장비가 나온 반납사진 첨부하여 반납신청하기' },
    { title: '방학 중 장비 대여 안내', color: '#4caf50', content: '• 장비 교육 수료 여부와 없이\n• 디지털콘텐츠학과 학생이면 대여가 가능합니다.\n• 사무실은 9:00 - 15:00시까지 운영됩니다.' },
  ],
  categories: ['Camera', 'Lens', 'Lighting', 'Battery', 'Sound', 'VR device', 'ETC'],
};

// 타입 안전하게 보정
export function normalizeSettings(raw) {
  const data = raw || {};
  return {
    adminEmails: Array.isArray(data.adminEmails) ? data.adminEmails : DEFAULT_SETTINGS.adminEmails,
    adminName:
      typeof data.adminName === 'string' && data.adminName.trim()
        ? data.adminName
        : DEFAULT_SETTINGS.adminName,
    adminPhone:
      typeof data.adminPhone === 'string' && data.adminPhone.trim()
        ? data.adminPhone
        : DEFAULT_SETTINGS.adminPhone,
    kakaoOpenChatUrl:
      typeof data.kakaoOpenChatUrl === 'string'
        ? data.kakaoOpenChatUrl
        : DEFAULT_SETTINGS.kakaoOpenChatUrl,
    notesCards:
      Array.isArray(data.notesCards) && data.notesCards.length > 0
        ? data.notesCards
        : DEFAULT_SETTINGS.notesCards,
    categories:
      Array.isArray(data.categories) && data.categories.length > 0
        ? data.categories
        : DEFAULT_SETTINGS.categories,
  };
}

// 1회 불러오기
export async function fetchAdminSettings() {
  const ref = doc(db, 'admin_settings', 'main');
  const snap = await getDoc(ref);
  return snap.exists() ? normalizeSettings(snap.data()) : DEFAULT_SETTINGS;
}

// 실시간 구독 (저장 시 다른 페이지에서도 즉시 반영)
export function subscribeAdminSettings(callback) {
  const ref = doc(db, 'admin_settings', 'main');
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) callback(normalizeSettings(snap.data()));
    else callback(DEFAULT_SETTINGS);
  });
}

// 저장(병합)
export async function saveAdminSettings({ adminEmails, adminName, adminPhone, kakaoOpenChatUrl, notesCards, categories, updatedBy = 'unknown' }) {
  const ref = doc(db, 'admin_settings', 'main');
  const payload = normalizeSettings({ adminEmails, adminName, adminPhone, kakaoOpenChatUrl, notesCards, categories });
  await setDoc(
    ref,
    { ...payload, updatedAt: serverTimestamp(), updatedBy },
    { merge: true }
  );
}