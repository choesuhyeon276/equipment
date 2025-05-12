/**
 * 날짜를 KST 기준 문자열로 변환
 * @param {Date} date - 변환할 Date 객체
 * @returns {string} - YYYY-MM-DD 형식의 문자열
 */
export const formatToKSTDateString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  
  /**
   * 대여 시간 옵션 생성 (9:00부터 17:00까지 30분 간격)
   * @returns {Array<string>} - 시간 옵션 배열
   */
  export const generateTimeOptions = () => {
    const options = [];
    let hour = 9;
    let minute = 0;
    
    while (hour < 17 || (hour === 17 && minute === 0)) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      options.push(time);
      minute += 30;
      if (minute === 60) {
        minute = 0;
        hour++;
      }
    }
    
    return options;
  };
  
  /**
   * 반납 시간 옵션 생성 (24시간 전체, 1시간 간격 + 23:59)
   * @returns {Array<string>} - 시간 옵션 배열
   */
  export const generateReturnTimeOptions = () => {
    const options = [];
    
    for (let hour = 0; hour < 24; hour++) {
      const time = `${String(hour).padStart(2, '0')}:00`;
      options.push(time);
    }
    
    options.push('23:59');
    return options;
  };