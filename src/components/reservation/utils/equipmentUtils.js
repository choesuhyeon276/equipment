import { collection, getDocs, query, where } from 'firebase/firestore';

/**
 * 가용성 계산에 필요한 데이터를 한 번만 읽어옵니다.
 * (active 예약 전체 + 전체 장바구니)
 *
 * 장비마다 이 데이터를 다시 읽으면 Firestore 읽기 비용이
 * 장비 수만큼 곱해지므로, 여러 장비를 확인할 때는 반드시 한 번만 읽고 재사용합니다.
 */
export const loadAvailabilityData = async (db) => {
  const [reservationSnapshot, cartSnapshot] = await Promise.all([
    getDocs(query(collection(db, 'reservations'), where('status', '==', 'active'))),
    getDocs(collection(db, 'user_carts')),
  ]);

  return {
    reservations: reservationSnapshot.docs.map((d) => d.data()),
    carts: cartSnapshot.docs.map((d) => ({ id: d.id, items: d.data().items || [] })),
  };
};

/**
 * 이미 읽어온 데이터로 장비 1개의 대여 가능 여부를 계산합니다. (Firestore 읽기 없음)
 * @returns {{available: boolean, unavailablePeriods: Array, myCartItems: Array}}
 */
export const computeAvailability = (data, equipmentId, startDate, endDate, currentUserId) => {
  const startDateTime = new Date(startDate);
  const endDateTime = new Date(endDate);

  let isAvailable = true;
  const unavailablePeriods = [];
  const myCartItems = [];

  // 진행 중(active) 예약과 겹치는지 확인
  data.reservations.forEach((reservationData) => {
    if (!reservationData.items || !Array.isArray(reservationData.items)) {
      return;
    }

    const matchingItem = reservationData.items.find((item) => item.id === equipmentId);
    if (!matchingItem) return;

    const reservationStart = new Date(reservationData.startDateTime);
    const reservationEnd = new Date(reservationData.endDateTime);

    if (startDateTime < reservationEnd && endDateTime > reservationStart) {
      isAvailable = false;
      unavailablePeriods.push({
        start: reservationData.startDateTime,
        end: reservationData.endDateTime,
        isRental: true,
      });
    }
  });

  // 장바구니와 겹치는지 확인
  data.carts.forEach((cart) => {
    const isMyCart = cart.id === currentUserId;

    cart.items.forEach((item) => {
      if (item.id !== equipmentId) return;

      const cartStart = new Date(item.rentalDate + 'T' + item.rentalTime);
      const cartEnd = new Date(item.returnDate + 'T' + item.returnTime);

      if (startDateTime < cartEnd && endDateTime > cartStart) {
        if (isMyCart) {
          // 내 장바구니에 있는 항목만 기록
          myCartItems.push({
            start: item.rentalDate,
            end: item.returnDate,
            inMyCart: true,
          });
        } else {
          // 다른 사용자의 장바구니 항목은 대여 불가능으로 처리
          isAvailable = false;
          unavailablePeriods.push({
            start: item.rentalDate,
            end: item.returnDate,
            inCart: true,
          });
        }
      }
    });
  });

  return {
    available: isAvailable,
    unavailablePeriods,
    myCartItems,
  };
};

/**
 * 여러 장비의 대여 가능 여부를 한 번에 확인합니다.
 * Firestore 읽기는 장비 수와 관계없이 1회분(예약 + 장바구니)만 발생합니다.
 * @returns {Promise<Object>} { [equipmentId]: {available, unavailablePeriods, myCartItems} }
 */
export const checkMultipleAvailability = async (equipmentIds, startDate, endDate, auth, db) => {
  const currentUserId = auth.currentUser ? auth.currentUser.uid : null;

  try {
    const data = await loadAvailabilityData(db);
    const results = {};
    equipmentIds.forEach((id) => {
      results[id] = computeAvailability(data, id, startDate, endDate, currentUserId);
    });
    return results;
  } catch (error) {
    console.error('대여 가능 여부 확인 중 오류:', error);
    const results = {};
    equipmentIds.forEach((id) => {
      results[id] = { available: false, error: true };
    });
    return results;
  }
};

/**
 * 특정 기간에 장비 1개의 대여 가능 여부를 확인하는 함수
 * (장비 1개만 확인할 때 사용. 여러 개는 checkMultipleAvailability 사용)
 */
export const checkEquipmentAvailability = async (equipmentId, startDate, endDate, auth, db) => {
  const results = await checkMultipleAvailability([equipmentId], startDate, endDate, auth, db);
  return results[equipmentId];
};
