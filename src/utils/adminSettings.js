// src/utils/adminSettings.js
import { db, doc, getDoc, setDoc, serverTimestamp } from '../firebase/firebaseConfig';
import { onSnapshot } from 'firebase/firestore';

export const DEFAULT_SETTINGS = {
  adminEmails: ['choesuhyeon276@gmail.com'],
  adminName: 'DKit 관리자',
  adminPhone: '010-0000-0000',
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
export async function saveAdminSettings({ adminEmails, adminName, adminPhone, updatedBy = 'unknown' }) {
  const ref = doc(db, 'admin_settings', 'main');
  const payload = normalizeSettings({ adminEmails, adminName, adminPhone });
  await setDoc(
    ref,
    { ...payload, updatedAt: serverTimestamp(), updatedBy },
    { merge: true }
  );
}
