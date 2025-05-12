import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * 특정 날짜에 장비의 대여 가능 여부를 확인하는 함수
 * @param {string} equipmentId - 확인할 장비 ID
 * @param {string} startDate - 대여 시작 날짜 (ISO 포맷)
 * @param {string} endDate - 대여 종료 날짜 (ISO 포맷)
 * @param {Object} auth - 파이어베이스 인증 객체
 * @param {Object} db - 파이어베이스 데이터베이스 객체
 * @returns {Promise<{available: boolean, unavailablePeriods: Array, myCartItems: Array}>}
 */
export const checkEquipmentAvailability = async (equipmentId, startDate, endDate, auth, db) => {
  const currentUser = auth.currentUser;
  const currentUserId = currentUser ? currentUser.uid : null;
  
  try {
    // 시작 및 종료 날짜/시간을 Date 객체로 변환
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    
    // 대여 가능 여부 확인을 위한 변수들 초기화
    let isAvailable = true;
    let unavailablePeriods = [];
    let myCartItems = [];
    
    // 모든 active 상태 예약 조회
    const rentalsRef = collection(db, 'reservations');
    const q = query(
      rentalsRef, 
      where('status', '==', 'active')
    );
    
    const querySnapshot = await getDocs(q);
    
    // 각 예약 문서를 확인
    querySnapshot.forEach(doc => {
      const reservationData = doc.data();
      
      // items 배열이 있는지 확인
      if (!reservationData.items || !Array.isArray(reservationData.items)) {
        return;
      }
      
      // 해당 장비가 포함된 예약인지 확인
      const matchingItem = reservationData.items.find(item => item.id === equipmentId);
      
      if (matchingItem) {
        // 예약의 시작/종료 시간
        const reservationStart = new Date(reservationData.startDateTime);
        const reservationEnd = new Date(reservationData.endDateTime);
        
        // 날짜가 겹치는지 확인
        if (startDateTime < reservationEnd && endDateTime > reservationStart) {
          isAvailable = false;
          unavailablePeriods.push({
            start: reservationData.startDateTime,
            end: reservationData.endDateTime,
            isRental: true
          });
        }
      }
    });
    
    // 장바구니 확인 로직
    const cartRef = collection(db, 'user_carts');
    const cartSnapshot = await getDocs(cartRef);
    
    cartSnapshot.forEach(doc => {
      const cartData = doc.data();
      const items = cartData.items || [];
      const isMyCart = doc.id === currentUserId;
      
      items.forEach(item => {
        if (item.id === equipmentId) {
          const cartStart = new Date(item.rentalDate + 'T' + item.rentalTime);
          const cartEnd = new Date(item.returnDate + 'T' + item.returnTime);
          
          if (startDateTime < cartEnd && endDateTime > cartStart) {
            // 내 장바구니에 있는 항목만 기록
            if (isMyCart) {
              myCartItems.push({
                start: item.rentalDate,
                end: item.returnDate,
                inMyCart: true
              });
            } else {
              // 다른 사용자의 장바구니 항목은 대여 불가능으로 처리
              isAvailable = false;
              unavailablePeriods.push({
                start: item.rentalDate,
                end: item.returnDate,
                inCart: true
              });
            }
          }
        }
      });
    });
    
    return {
      available: isAvailable,
      unavailablePeriods,
      myCartItems
    };
  } catch (error) {
    console.error("대여 가능 여부 확인 중 오류:", error);
    return { available: false, error: true };
  }
};