import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';

/**
 * 장바구니에 항목 추가
 * @param {Object} camera - 추가할 장비 객체
 * @param {string} rentalDate - 대여 날짜
 * @param {string} rentalTime - 대여 시간
 * @param {string} returnDate - 반납 날짜
 * @param {string} returnTime - 반납 시간
 * @param {Object} auth - 파이어베이스 인증 객체
 * @param {Object} db - 파이어베이스 데이터베이스 객체
 * @returns {Promise<boolean>} - 추가 성공 여부
 */
export const addToCart = async (camera, rentalDate, rentalTime, returnDate, returnTime, auth, db) => {
  const user = auth.currentUser;
  if (!user) {
    return false;
  }
  
  try {
    const userCartRef = doc(db, 'user_carts', user.uid);
    
    const cartItem = {
      ...camera,
      rentalDate,
      rentalTime,
      returnDate,
      returnTime,
      addedAt: new Date().toISOString()
    };

    const cartDoc = await getDoc(userCartRef);
    
    if (cartDoc.exists()) {
      const currentItems = cartDoc.data().items || [];
      const isDuplicate = currentItems.some(
        item => item.id === camera.id && 
        item.rentalDate === rentalDate && 
        item.rentalTime === rentalTime
      );

      if (isDuplicate) {
        return false;
      }

      await updateDoc(userCartRef, {
        items: arrayUnion(cartItem)
      });
    } else {
      await setDoc(userCartRef, {
        items: [cartItem]
      });
    }
    
    return true;
  } catch (error) {
    console.error("장바구니 추가 중 오류:", error);
    return false;
  }
};

/**
 * 장바구니 아이템 수 가져오기
 * @param {string} userId - 사용자 ID
 * @param {Object} db - 파이어베이스 데이터베이스 객체
 * @returns {Promise<number>} - 장바구니 아이템 수
 */
export const fetchCartItemCount = async (userId, db) => {
  try {
    if (!userId) return 0;
    
    const userCartRef = doc(db, 'user_carts', userId);
    const cartDoc = await getDoc(userCartRef);
    
    if (cartDoc.exists()) {
      const items = cartDoc.data().items || [];
      return items.length;
    }
    
    return 0;
  } catch (error) {
    console.error("장바구니 아이템 수 가져오기 실패:", error);
    return 0;
  }
};