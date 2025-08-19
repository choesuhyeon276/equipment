// adminUtils.js - 관리자 설정 관련 유틸리티 함수들
import { db, doc, getDoc } from '../firebase/firebaseConfig';

/**
 * 관리자 설정을 Firebase에서 가져오는 함수
 * @returns {Promise<Object>} 관리자 설정 객체
 */
export const getAdminSettings = async () => {
  try {
    const settingsRef = doc(db, 'admin_settings', 'main');
    const settingsDoc = await getDoc(settingsRef);
    
    if (settingsDoc.exists()) {
      const data = settingsDoc.data();
      return {
        adminEmails: data.adminEmails || ["choesuhyeon276@gmail.com", "Gkrry24@khu.ac.kr"],
        adminName: data.adminName || "DKit 관리자",
        adminPhone: data.adminPhone || "010-0000-0000",
        updatedAt: data.updatedAt || null,
        createdAt: data.createdAt || null
      };
    } else {
      // 기본값 반환
      return {
        adminEmails: ["choesuhyeon276@gmail.com", "Gkrry24@khu.ac.kr"],
        adminName: "DKit 관리자",
        adminPhone: "010-0000-0000",
        updatedAt: null,
        createdAt: null
      };
    }
  } catch (error) {
    console.error('❌ 관리자 설정 불러오기 실패:', error);
    // 에러 시 기본값 반환
    return {
      adminEmails: ["choesuhyeon276@gmail.com", "Gkrry24@khu.ac.kr"],
      adminName: "DKit 관리자",
      adminPhone: "010-0000-0000",
      updatedAt: null,
      createdAt: null
    };
  }
};

/**
 * 관리자 이메일 목록만 가져오는 함수
 * @returns {Promise<Array>} 관리자 이메일 배열
 */
export const getAdminEmails = async () => {
  try {
    const settings = await getAdminSettings();
    return settings.adminEmails;
  } catch (error) {
    console.error('❌ 관리자 이메일 불러오기 실패:', error);
    return ["choesuhyeon276@gmail.com", "Gkrry24@khu.ac.kr"];
  }
};

/**
 * 관리자 이름만 가져오는 함수
 * @returns {Promise<string>} 관리자 이름
 */
export const getAdminName = async () => {
  try {
    const settings = await getAdminSettings();
    return settings.adminName;
  } catch (error) {
    console.error('❌ 관리자 이름 불러오기 실패:', error);
    return "DKit 관리자";
  }
};

/**
 * 관리자 전화번호만 가져오는 함수
 * @returns {Promise<string>} 관리자 전화번호
 */
export const getAdminPhone = async () => {
  try {
    const settings = await getAdminSettings();
    return settings.adminPhone;
  } catch (error) {
    console.error('❌ 관리자 전화번호 불러오기 실패:', error);
    return "010-0000-0000";
  }
};

/**
 * 관리자 설정이 존재하는지 확인하는 함수
 * @returns {Promise<boolean>} 설정 존재 여부
 */
export const checkAdminSettingsExist = async () => {
  try {
    const settingsRef = doc(db, 'admin_settings', 'main');
    const settingsDoc = await getDoc(settingsRef);
    return settingsDoc.exists();
  } catch (error) {
    console.error('❌ 관리자 설정 존재 확인 실패:', error);
    return false;
  }
};

/**
 * 관리자 설정을 초기화하는 함수 (클라이언트에서 호출용)
 * @returns {Promise<boolean>} 초기화 성공 여부
 */
export const initializeAdminSettings = async () => {
  try {
    // Firebase Functions의 initializeAdminSettings 엔드포인트 호출
    const response = await fetch('/api/initializeAdminSettings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      return result.success;
    } else {
      console.error('❌ 관리자 설정 초기화 API 오류');
      return false;
    }
  } catch (error) {
    console.error('❌ 관리자 설정 초기화 실패:', error);
    return false;
  }
};

/**
 * 이메일 형식을 검증하는 함수
 * @param {string} email - 검증할 이메일
 * @returns {boolean} 유효한 이메일 형식 여부
 */
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * 전화번호 형식을 검증하는 함수
 * @param {string} phone - 검증할 전화번호
 * @returns {boolean} 유효한 전화번호 형식 여부
 */
export const validatePhone = (phone) => {
  const phoneRegex = /^01[0-9]-\d{3,4}-\d{4}$/;
  return phoneRegex.test(phone);
};

/**
 * 관리자 설정 정보를 포맷팅하여 반환하는 함수
 * @returns {Promise<string>} 포맷팅된 관리자 정보 문자열
 */
export const getFormattedAdminInfo = async () => {
  try {
    const settings = await getAdminSettings();
    return `관리자: ${settings.adminName}\n연락처: ${settings.adminPhone}\n이메일: ${settings.adminEmails.join(', ')}`;
  } catch (error) {
    console.error('❌ 관리자 정보 포맷팅 실패:', error);
    return '관리자: DKit 관리자\n연락처: 010-0000-0000\n이메일: choesuhyeon276@gmail.com';
  }
};