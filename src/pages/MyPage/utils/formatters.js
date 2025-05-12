// src/pages/MyPage/utils/formatters.js

/**
 * 전화번호 형식으로 포맷팅
 * @param {string} value - 입력된 전화번호 문자열
 * @returns {string} - 포맷팅된 전화번호 (예: 010-1234-5678)
 */
export const formatPhoneNumber = (value) => {
  const onlyNums = value.replace(/[^0-9]/g, '');
  if (onlyNums.length <= 3) return onlyNums;
  if (onlyNums.length <= 7) return onlyNums.replace(/(\d{3})(\d+)/, '$1-$2');
  return onlyNums.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3').slice(0, 13);
};

/**
 * ISO 문자열을 한국 날짜/시간 형식으로 변환
 * @param {string} isoString - ISO 형식 날짜 문자열
 * @returns {string} - 포맷팅된 날짜 (예: 2023년 10월 15일 14시 30분)
 */
export const formatKoreanDateTime = (isoString) => {
  if (!isoString) return '날짜 없음';
  const date = new Date(isoString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); 
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}년 ${month}월 ${day}일 ${hour}시 ${minute}분`;
};

/**
 * Firebase Timestamp를 한국 날짜/시간 형식으로 변환
 * @param {object} timestamp - Firebase Timestamp 객체
 * @returns {string} - 포맷팅된 날짜 (예: 2023년 10월 15일 오후 2시 30분 45초)
 */
export const formatFullKoreanDateTime = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return '날짜 없음';
  
  const date = timestamp.toDate(); // Firebase Timestamp → JS Date

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  const ampm = hour < 12 ? '오전' : '오후';
  hour = hour % 12 || 12; // 0시는 12시로 표시

  return `${year}년 ${month}월 ${day}일 ${ampm} ${hour}시 ${minute}분 ${second}초`;
};

/**
 * 날짜와 시간을 표시 형식으로 변환
 * @param {string} dateString - 날짜 문자열
 * @param {string} timeString - 시간 문자열 (선택적)
 * @returns {string} - 포맷팅된 날짜와 시간
 */
export const formatDate = (dateString, timeString) => {
  if (!dateString) return 'N/A';
  const formattedDate = dateString;
  return timeString ? `${formattedDate} ${timeString}` : formattedDate;
};