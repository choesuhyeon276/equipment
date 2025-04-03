import React, { useState, useEffect } from 'react';
import { User, ShoppingCart, Trash2, CheckCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  db, 
  app,
  getAuth,
  updateDoc,
  doc,
  getDoc,
  getImageURL,
  setDoc
} from '../firebase/firebaseConfig';

const CartPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState({});
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null); // Added to store user profile data
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 관리자 캘린더 ID (환경 변수에서 가져옴)
  const ADMIN_CALENDAR_ID = process.env.REACT_APP_CALENDAR_ID || '837ac43ba185f6e8b56e97f1f7e15ecbb103bc44c111e6b8c81fe28ec713b8e9@group.calendar.google.com';
  
  // API 엔드포인트 (백엔드 서버 URL로 변경 필요)
  const API_ENDPOINT = process.env.REACT_APP_API_ENDPOINT || '/api/calendar';

  // 내비게이션 핸들러
  const handleHomeNavigation = () => {
    navigate('/main');
  };

  const handleCalendarNavigation = () => {
    navigate('/calendar', { state: { scrollTo: 'calendar-section' } });
  };

  const handleNoteNavigation = () => {
    navigate('/thingsnote', { state: { scrollTo: 'notes-section' } });
  };

  const handleMypageNavigation = () => {
    navigate('/mypage');
  };
  
  const handleReservateNavigation = () => {
    navigate('/ReservationMainPage');
  };

  // Firebase에서 장바구니 아이템 가져오는 함수
  const fetchFirebaseCartItems = async (userId) => {
    try {
      const userCartRef = doc(db, 'user_carts', userId);
      const cartDoc = await getDoc(userCartRef);
      
      console.log('Firebase Cart Document:', cartDoc.exists());

      if (cartDoc.exists()) {
        const firebaseCartItems = cartDoc.data().items || [];
        console.log('Firebase Cart Items:', firebaseCartItems);
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
      
      console.log('Firebase User Profile Document:', profileDoc.exists());

      if (profileDoc.exists()) {
        const profileData = profileDoc.data();
        console.log('User Profile Data:', profileData);
        setUserProfile(profileData);
      }
    } catch (error) {
      console.error('Firebase 사용자 프로필 불러오기 실패:', error);
    }
  };

  // 관리자 캘린더에 직접 이벤트 추가 (백엔드를 통해 처리)
  const createAdminCalendarEvent = async () => {
    if (!user) {
      return alert('로그인이 필요합니다.');
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
        summary: `DIRT 대여 신청 - ${userProfile?.name || user.uid}`,
        description: `${userInfo}\n\n대여 장비 목록:\n${itemListText}`,
        startDateTime,
        endDateTime,
        calendarId: ADMIN_CALENDAR_ID,
        timeZone: 'Asia/Seoul'
      };
      
      console.log('Creating admin calendar event:', eventData);
      
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
      
      const result = await response.json();
      console.log('캘린더 등록 성공:', result);
      
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
      alert('예약이 성공적으로 등록되었습니다!');
    } catch (error) {
      console.error('캘린더 등록 오류:', error);
      alert('캘린더 등록 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 방법 2: 임시로 Firebase에만 예약 정보 저장하는 함수 (관리자 캘린더 API가 아직 없을 경우)
  const saveReservationToFirebase = async () => {
    if (!user) {
      return alert('로그인이 필요합니다.');
    }
    
    if (isSubmitting) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const firstItem = cartItems[0];
      const startDateTime = `${firstItem.rentalDate}T${firstItem.rentalTime}:00`;
      const endDateTime = `${firstItem.returnDate}T${firstItem.returnTime}:00`;
  
      // 사용자 정보를 포함하여 예약 문서 생성
      const reservationId = `${user.uid}_${Date.now()}`;
      const reservationsRef = doc(db, 'reservations', reservationId);
      await setDoc(reservationsRef, {
        userId: user.uid,
        items: cartItems,
        startDateTime,
        endDateTime,
        status: 'pending', // 관리자 승인 대기 상태
        createdAt: new Date().toISOString(),
        // 사용자 프로필 정보 추가
        userName: userProfile?.name || '',
        userPhone: userProfile?.phoneNumber || '',
        userStudentId: userProfile?.studentId || '',
        userEmail: userProfile?.email || ''
      });

      if (uploadedFileName) {
        reservationData.long_imageURL = uploadedFileName;
      }
      await addDoc(collection(db, 'reservations'), reservationData);
      
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
      alert('예약 신청이 완료되었습니다! 관리자 확인 후 최종 승인됩니다.');
    } catch (error) {
      console.error('예약 저장 오류:', error);
      alert('예약 저장 중 오류가 발생했습니다: ' + error.message);
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
      console.log('Stored User:', parsedUser);
      fetchFirebaseCartItems(parsedUser.uid);
      fetchUserProfile(parsedUser.uid); // 사용자 프로필 정보도 가져오기
    } else {
      console.log('No user found in localStorage');
      setLoading(false);
    }
  }, []);

  // 로컬스토리지나 location state에서 장바구니 아이템 로드
  useEffect(() => {
    // location state에서 아이템 전달 여부 확인
    const passedCartItems = location.state?.cartItems;
    
  
    if (passedCartItems) {
      // 이전 페이지에서 전달된 아이템이 있으면 사용
      setCartItems(passedCartItems);
      localStorage.setItem('cart', JSON.stringify(passedCartItems));

      if (passedFileName) {
        setUploadedFileName(passedFileName); // 👈 따로 useState 만들어줘야 함
      }

      setLoading(false);


    } else if (!user) {
      // 유저가 없고 전달된 아이템도 없으면 로컬스토리지에서 로드
      const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
      setCartItems(storedCart);
      setLoading(false);
    }
    // user가 있는 경우에는 fetchFirebaseCartItems에서 loading 상태를 업데이트함
  }, [location.state]);
  
  const [uploadedFileName, setUploadedFileName] = useState('');

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
  
  // 유저 정보 렌더링 (헤더용)
  const renderUserInfo = () => {
    if (user) {
      return (
        <div style={{ 
          position: 'absolute',
          right: '200px',
          top: '0px',
          fontSize: '14px',
          color: 'green',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {userProfile?.name && (
            <>
             
            </>
          )}
        </div>
      );
    }
    return null;
  };

  // 예약 정보 섹션 렌더링
  const renderReservationSummary = () => {
    return (
      <div style={{ 
        flex: 1, 
        border: '1px solid #E0E0E0', 
        borderRadius: '10px',
        padding: '20px',
        marginRight: '100px',
        height: 'fit-content'
      }}>
        <h3 style={{ 
          fontSize: '20px', 
          fontWeight: 'bold', 
          marginBottom: '20px' 
        }}>
          예약 요약
        </h3>

        {/* 사용자 정보 표시 */}
        {userProfile && (
          <div style={{
            marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#f9f9f9',
            borderRadius: '8px'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>예약자 정보</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>이름:</span>
              <span>{userProfile.name || '미입력'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
              <span>연락처:</span>
              <span>{userProfile.phoneNumber || '미입력'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>학번:</span>
              <span>{userProfile.studentId || '미입력'}</span>
            </div>
          </div>
        )}

        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          marginRight: '0px',
          marginBottom: '20px',
          fontWeight: 'bold',
          fontSize: '18px'
        }}>
          <span>총 예약 장비 수</span>
          <span>{cartItems.length}개</span>
        </div>

        <button 
          onClick={handleSubmitReservation}
          disabled={isSubmitting}
          style={{
            width: '100%',
            padding: '15px',
            backgroundColor: isSubmitting ? '#666' : 'black',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '18px',
            cursor: isSubmitting ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}
        >
          <CheckCircle size={20} />
          {isSubmitting ? '처리 중...' : '예약하기'}
        </button>
      </div>
    );
  };

  // 각 장바구니 아이템의 대여 상세정보 렌더링
  const renderRentalDetails = (item) => {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'flex-start', 
        marginTop: '15px' 
      }}>
        <div style={{ marginBottom: '5px' }}>
          <span style={{ fontWeight: 'bold', marginRight: '10px' }}>대여 시작:</span>
          {item.rentalDate} {item.rentalTime}
        </div>
        <div>
          <span style={{ fontWeight: 'bold', marginRight: '10px' }}>반납 예정:</span>
          {item.returnDate} {item.returnTime}
        </div>
      </div>
    );
  };

  // 예약 제출 핸들러 - 백엔드 API 또는 Firebase 중 선택
  const handleSubmitReservation = () => {
    // API_ENDPOINT가 설정되어 있으면 백엔드 API를 사용, 아니면 Firebase에 저장
    if (API_ENDPOINT !== '/api/calendar') {
      createAdminCalendarEvent();
    } else {
      saveReservationToFirebase();
    }
  };

  return (
    <div style={{
      position: 'relative',
      width: '1440px',
      minHeight: '100vh',
      background: '#FFFFFF',
      margin: '0 auto',
      paddingBottom: '150px',
      fontFamily: 'Pretendard, sans-serif',
      color: '#000000'
    }}>
      {/* Header Section */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '10px',
        right: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '0px solid #5F5F5F',
        paddingBottom: '45px'
      }}>
        {renderUserInfo()}
      </div>

      {/* Navigation and Logo Area */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        right: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '0px solid #5F5F5F',
        paddingBottom: '45px'
      }}>
        <div style={{ 
          display: 'flex',
          position: 'absolute',
          gap: '20px',
          fontSize: '18px',
          fontWeight: '400',
          right: "-4px",
          top: '45px'
        }}>
          <span onClick={handleHomeNavigation} style={{ cursor: 'pointer' }}>Home</span>
          <span onClick={handleCalendarNavigation} style={{ cursor: 'pointer' }}>Calendar</span>
          <span onClick={handleReservateNavigation} style={{ cursor: 'pointer' }}>Reservation</span>
          <span onClick={handleNoteNavigation} style={{ cursor: 'pointer' }}>Note</span>
          <span onClick={handleMypageNavigation} style={{ cursor: 'pointer' }}></span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div onClick={handleHomeNavigation} style={{ 
            position: 'absolute',
            fontSize: '36px', 
            fontWeight: 'bold', 
            letterSpacing: '0px',
            top: '0px',
            left: '70px',
            cursor: "pointer"
          }}>DIRT</div>
          <div style={{ 
            fontSize: '12px', 
            color: '#000000',
            position: 'absolute',
            left: '110px',
            top: '40px',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            fontWeight: '100'
          }}>Digital content rental service</div>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ 
            display: 'flex',
            position: 'absolute',
            right: '110px',
            top: '0px',
            alignItems: 'center', 
            gap: '5px', 
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: '20px',
            backgroundColor: '#f0f0f0'
          }}>
            <User size={20} />
            <span onClick={handleMypageNavigation} style={{ cursor: 'pointer' }}>My page</span>
          </div>
          <div style={{ 
            position: 'absolute',
            right: '13px',
            display: 'flex', 
            top: '0px',
            alignItems: 'center', 
            gap: '5px', 
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: '20px',
            backgroundColor: '#cccccc'
          }}>
            <ShoppingCart size={20} />
            <span>Cart</span>
          </div>
        </div>
      </div>

      {/* Cart Content Area */}
      <div style={{
        position: 'relative',
        top: '150px',
        left: '50px',
        right: '50px',
        paddingBottom: '20px'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '20px', 
          marginLeft: '40px'
        }}>
          장바구니
        </h2>

        {loading ? (
          <div>로딩 중...</div>
        ) : cartItems.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#888',
            padding: '50px' 
          }}>
            장바구니가 비어있습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '20px' }}>
            {/* Cart Items */}
            <div style={{ 
              flex: 2, 
              border: '1px solid #E0E0E0', 
              borderRadius: '10px',
              padding: '20px'
            }}>
              {cartItems.map((item) => (
                <div 
                  key={item.id} 
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    borderBottom: '1px solid #E0E0E0',
                    paddingBottom: '15px',
                    marginBottom: '15px'
                  }}
                >
                  {/* Item Image */}
                  <div style={{ 
                    width: '150px', 
                    height: '150px', 
                    marginRight: '20px',
                    backgroundColor: '#F5F5F5',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    {imageUrls[item.id] ? (
                      <img 
                        src={imageUrls[item.id]} 
                        alt={item.name} 
                        style={{ 
                          width: '100%', 
                          height: '100%', 
                          objectFit: 'cover' 
                        }} 
                      />
                    ) : (
                      item.name
                    )}
                  </div>

                  {/* Item Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      alignItems: 'center' 
                    }}>
                      <h3 style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold' 
                      }}>
                        {item.name}
                      </h3>
                      <div 
                        style={{ 
                          cursor: 'pointer',
                          color: '#888'
                        }}
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 size={20} />
                      </div>
                    </div>
                    <p style={{ color: '#666', marginTop: '5px' }}>
                      {item.category} | {item.condition}
                    </p>

                    {/* Rental Details */}
                    {renderRentalDetails(item)}
                  </div>
                </div>
              ))}
            </div>

            {/* Reservation Summary Section */}
            {renderReservationSummary()}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;