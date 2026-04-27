import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  db, 
  app,
  getAuth,
  updateDoc,
  doc,
  getDoc,
  getImageURL,
  collection,
  setDoc,
  getFirestore
} from '../../firebase/firebaseConfig';

// 컴포넌트 임포트
import CartHeader from './CartHeader';
import CartItemDesktop from './CartItemDesktop';
import CartItemMobile from './CartItemMobile';
import ReservationSummaryDesktop from './ReservationSummaryDesktop';
import ReservationSummaryMobile from './ReservationSummaryMobile';

const CartPage = () => {
  const location = useLocation();
  const uploadedFileURL = location.state?.uploadedFileURL || localStorage.getItem('uploadedFileURL');
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState({});
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Added to store user profile data
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // 관리자 캘린더 ID (환경 변수에서 가져옴)
  const ADMIN_CALENDAR_ID = process.env.REACT_APP_CALENDAR_ID || '837ac43ba185f6e8b56e97f1f7e15ecbb103bc44c111e6b8c81fe28ec713b8e9@group.calendar.google.com';
  
  // API 엔드포인트 (백엔드 서버 URL로 변경 필요)
  const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || '/api/calendar';

  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Firebase에서 장바구니 아이템 가져오는 함수
  const fetchFirebaseCartItems = async (userId) => {
    try {
      const userCartRef = doc(db, 'user_carts', userId);
      const cartDoc = await getDoc(userCartRef);
      
      if (cartDoc.exists()) {
        const firebaseCartItems = cartDoc.data().items || [];
        setCartItems(firebaseCartItems);
        localStorage.setItem('cart', JSON.stringify(firebaseCartItems));
      }
      setLoading(false);
    } catch (error) {
      console.error('Firebase 장바구니 불러오기 실패:', error);
      setLoading(false);
    }
  };

  // Firebase에서 사용자 프로필 정보 가져오기
  const fetchUserProfile = async (userId) => {
    try {
      const userProfileRef = doc(db, 'user_profiles', userId);
      const profileDoc = await getDoc(userProfileRef);
      
      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        setUserProfile(profileData);
      }
    } catch (error) {
      console.error('Firebase 사용자 프로필 불러오기 실패:', error);
    }
  };

  // 관리자 캘린더에 직접 이벤트 추가 (백엔드를 통해 처리)
  const createAdminCalendarEvent = async () => {
    if (!user) {
      return toast.warn('로그인이 필요합니다.');
    }
    
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const firstItem = cartItems[0];
      const startDateTime = `${firstItem.rentalDate}T${firstItem.rentalTime}:00`;
      const endDateTime = `${firstItem.returnDate}T${firstItem.returnTime}:00`;

      // 사용자 정보 포함
      const userInfo = userProfile ? 
        `예약자 ID: ${user.uid}
        이름: ${userProfile.name || '미입력'}
        연락처: ${userProfile.phoneNumber || '미입력'}
        학번: ${userProfile.studentId || '미입력'}
        이메일: ${userProfile.email || '미입력'}`
        : `예약자 ID: ${user.uid}`;

      const itemListText = cartItems.map((item, index) =>
        `${index + 1}. ${item.name} (${item.category})\n대여: ${item.rentalDate} ${item.rentalTime} ~ 반납: ${item.returnDate} ${item.returnTime}`
      ).join('\n');

      const eventData = {
        summary: `DKit 대여 신청 - ${userProfile?.name || user.uid}`,
        description: `${userInfo}\n\n대여 장비 목록:\n${itemListText}`,
        startDateTime,
        endDateTime,
        calendarId: ADMIN_CALENDAR_ID,
        timeZone: 'Asia/Seoul'
      };
      
      // 방법 1: 백엔드 API를 통해 이벤트 생성 (Firebase Function 또는 별도 서버)
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        throw new Error('서버에서 오류가 발생했습니다.');
      }
      
      await response.json();

      // 성공 시 장바구니 비우기
      if (user) {
        try {
          const userCartRef = doc(db, 'user_carts', user.uid);
          await updateDoc(userCartRef, {
            items: []
          });
        } catch (error) {
          console.error('Firebase 장바구니 비우기 실패:', error);
        }
      }
      
      localStorage.removeItem('cart');
      setCartItems([]);
      toast.success('예약이 성공적으로 등록되었습니다!');
    } catch (error) {
      console.error('캘린더 등록 오류:', error);
      toast.warn('캘린더 등록 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 임시로 Firebase에만 예약 정보 저장하는 함수 (관리자 캘린더 API가 아직 없을 경우)
  const saveReservationToFirebase = async () => {
    if (!user || !user.uid) {
      console.error("❗ 유저 정보가 없습니다.");
      toast.warn("로그인 후 이용해주세요.");
      return;
    }
    
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 날짜별로 아이템 그룹화
      const itemsByDate = {};
      cartItems.forEach(item => {
        const dateKey = `${item.rentalDate}_${item.rentalTime}_${item.returnDate}_${item.returnTime}`;
        if (!itemsByDate[dateKey]) {
          itemsByDate[dateKey] = {
            rentalDate: item.rentalDate,
            rentalTime: item.rentalTime,
            returnDate: item.returnDate,
            returnTime: item.returnTime,
            items: []
          };
        }
        itemsByDate[dateKey].items.push(item);
      });

      // 각 날짜 그룹별로 예약 생성
      const reservationPromises = Object.values(itemsByDate).map(async (group) => {
        const startDateTime = `${group.rentalDate}T${group.rentalTime}:00`;
        const endDateTime = `${group.returnDate}T${group.returnTime}:00`;

        // 1️⃣ 구글 캘린더 이벤트 생성
        let calendarEventId = null;
        
        if (window.gapi && window.gapi.client && window.gapi.client.calendar) {
          try {
            const itemListText = group.items.map((item, index) =>
              `${index + 1}. ${item.name} (${item.category})`
            ).join('\n');

            const event = {
              summary: `DKit 대여 - ${userProfile?.name || user.email}`,
              description: `예약자: ${userProfile?.name || '미입력'}\n연락처: ${userProfile?.phoneNumber || '미입력'}\n학번: ${userProfile?.studentId || '미입력'}\n\n대여 장비:\n${itemListText}`,
              start: {
                dateTime: startDateTime,
                timeZone: 'Asia/Seoul',
              },
              end: {
                dateTime: endDateTime,
                timeZone: 'Asia/Seoul',
              },
              colorId: '9', // 파란색
            };

            const response = await window.gapi.client.calendar.events.insert({
              calendarId: 'primary',
              resource: event,
            });

            calendarEventId = response.result.id;
          } catch (calError) {
            // 캘린더 실패해도 예약은 진행
          }
        }

        // 2️⃣ Firestore에 예약 저장 (calendarEventId 포함)
        const reservationId = `${user.uid}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const reservationsRef = doc(db, 'reservations', reservationId);
        
        await setDoc(reservationsRef, {
          userId: user.uid,
          items: group.items,
          startDateTime,
          endDateTime,
          status: 'pending',
          createdAt: new Date().toISOString(),
          userName: userProfile?.name || '',
          userPhone: userProfile?.phoneNumber || '',
          userStudentId: userProfile?.studentId || '',
          userEmail: userProfile?.email || '',
          long_imageURL: uploadedFileURL || null,
          calendarEventId: calendarEventId,
        });
      });

      // 모든 예약 저장 완료 대기
      const results = await Promise.allSettled(reservationPromises);
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        throw new Error(`${failed.length}개 예약 저장에 실패했습니다.`);
      }

      // 3️⃣ 장바구니 비우기
      if (user) {
        try {
          const userCartRef = doc(db, 'user_carts', user.uid);
          await updateDoc(userCartRef, {
            items: []
          });
        } catch (error) {
          console.error('Firebase 장바구니 비우기 실패:', error);
        }
      }
    
      localStorage.removeItem('cart');
      setCartItems([]);
      
      const groupCount = Object.keys(itemsByDate).length;
      toast.success(`${groupCount}개의 예약 신청이 완료되었습니다! 관리자 확인 후 최종 승인됩니다.`);
      
    } catch (error) {
      console.error('예약 저장 오류:', error);
      toast.warn('예약 저장 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 페이지 로드 시 인증 및 세션 유지
  useEffect(() => {
    // 로컬 스토리지에서 유저 정보 가져오기
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchFirebaseCartItems(parsedUser.uid);
      fetchUserProfile(parsedUser.uid);
    } else {
      setLoading(false);
    }
  }, []);

  // 로컬스토리지나 location state에서 장바구니 아이템 로드
  useEffect(() => {
    const passedCartItems = location.state?.cartItems;
    const passedFileName = location.state?.uploadedFileName;
  
    if (passedCartItems) {
      setCartItems(passedCartItems);
      localStorage.setItem('cart', JSON.stringify(passedCartItems));
    }
  
    if (passedFileName) {
      // uploadedFileName 처리 (필요시 활성화)
      // setUploadedFileName(passedFileName);
    }
  
    if (!passedCartItems && !user) {
      const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
      setCartItems(storedCart);
    }
  
    setLoading(false);
  }, [location.state]);
  
  // 이미지 로딩
  useEffect(() => {
    const urls = {};
    for (const item of cartItems) {
      urls[item.id] = item.imageURL || null; // ✅ imageURL을 직접 사용
    }
    setImageUrls(urls);
  }, [cartItems]);
  
  // 장바구니에서 아이템 제거
  const removeFromCart = async (itemId) => {
    const updatedCart = cartItems.filter(item => item.id !== itemId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));

    // Firebase에서도 아이템 제거
    if (user) {
      try {
        const userCartRef = doc(db, 'user_carts', user.uid);
        await updateDoc(userCartRef, {
          items: updatedCart
        });
      } catch (error) {
        console.error('Firebase 장바구니에서 아이템 제거 실패:', error);
      }
    }
  };
  
  // 예약 제출 핸들러 - 백엔드 API 또는 Firebase 중 선택
  const handleSubmitReservation = () => {
    const auth = getAuth();
    const user = auth.currentUser;
    // API_ENDPOINT가 설정되어 있으면 백엔드 API를 사용, 아니면 Firebase에 저장
    if (!user || !user.uid) {
      toast.warn("로그인이 필요합니다.");
      return;
    }
  
    const firstItem = cartItems[0];

    if (!firstItem || !firstItem.rentalDate || !firstItem.returnDate) {
      toast.warn("대여 날짜와 반납 날짜를 선택해주세요.");
      return;
    }

    saveReservationToFirebase();
  };

  if (loading) {
    return (
      <div className="loading-spinner-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <div className="loading-spinner"></div>
        <p>로딩 중...</p>
      </div>
    );
  }

  // 모바일 버전 렌더링
  if (isMobile) {
    return (
      <div className="page-container" style={{
        width: '100%',
        minHeight: '100vh',
        background: '#fff',
        fontFamily: 'Pretendard, sans-serif',
        color: '#000',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* 헤더 */}
        <CartHeader isMobile={true} />
        
        {/* 장바구니 내용 */}
        <div style={{
          flex: 1,
          padding: '16px',
          paddingBottom: '120px' // 하단 예약 영역 공간 확보
        }}>
          {cartItems.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              color: '#888',
              padding: '40px 20px',
              fontSize: '14px'
            }}>
              장바구니가 비어있습니다.
            </div>
          ) : (
            <>
              {/* 장바구니 아이템 목록 */}
              {cartItems.map((item) => (
                <CartItemMobile 
                  key={item.id}
                  item={item}
                  onRemove={removeFromCart}
                />
              ))}
            </>
          )}
        </div>
        
        {/* 예약 요약 (하단 고정) */}
        {cartItems.length > 0 && (
          <ReservationSummaryMobile 
            cartItems={cartItems}
            userProfile={userProfile}
            isSubmitting={isSubmitting}
            onSubmit={handleSubmitReservation}
          />
        )}
      </div>
    );
  }

  // 데스크탑 버전 렌더링
  return (
    <div className="page-container" style={{
      position: 'relative',
      width: '100%',
      maxWidth: '1440px',
      minHeight: '100vh',
      background: '#FFFFFF',
      margin: '0 auto',
      paddingBottom: '150px',
      fontFamily: 'Pretendard, sans-serif',
      color: '#000000',
    }}>
      {/* 헤더 */}
      <div style={{
        position: 'relative',
        top: '20px',
        left: '0px',
        right: '20px',
        paddingBottom: '20px'
      }}>
        <CartHeader isMobile={false} />
      </div>

      {/* 장바구니 내용 영역 */}
      <div style={{
        position: 'relative',
        marginTop: '70px',
        left: '50px',
        right: '50px',
        paddingBottom: '20px'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '20px', 
          marginLeft: '20px'
        }}>
          
        </h2>

        {cartItems.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#888',
            padding: '50px' 
          }}>
            장바구니가 비어있습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '20px' }}>
            {/* 장바구니 아이템 목록 */}
            <div style={{ 
              flex: 2, 
              border: '1px solid #E0E0E0', 
              borderRadius: '10px',
              padding: '20px'
            }}>
              {cartItems.map((item) => (
                <CartItemDesktop 
                  key={item.id}
                  item={item}
                  onRemove={removeFromCart}
                />
              ))}
            </div>

            {/* 예약 요약 섹션 */}
            <ReservationSummaryDesktop 
              cartItems={cartItems}
              userProfile={userProfile}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmitReservation}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;