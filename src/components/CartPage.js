import React, { useState, useEffect } from 'react';
import { User, ShoppingCart, Trash2, CheckCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { gapi } from 'gapi-script';
import {
  auth, 
  db, 
  getImageURL,
  app,
  getAuth,
  updateDoc,
  doc,
  getFirestore,
  getDoc}
  from '../firebase/firebaseConfig';



const CartPage = () => {
  const location = useLocation();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState({});
  const [user, setUser] = useState(null);
  
  // Use the db and auth from the imported config or create them here
  const firestore = getFirestore(app);
  const authInstance = getAuth(app);

  // Firebase에서 장바구니 아이템 가져오는 함수 추가
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

  // Google Calendar API configuration
  const CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID;
  const API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
  const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

  // Page load authentication and session maintenance
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      console.log('Stored User:', parsedUser);
    console.log('User UID:', parsedUser.uid);

      // Firebase에서 장바구니 불러오기
      fetchFirebaseCartItems(parsedUser.uid);
    } else {
      console.log('No user found in localStorage');
    }





    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = initClient; // 수정됨: async와 defer 속성 제거
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  // Load cart items from localStorage or passed state
  useEffect(() => {
    // Check if items were passed through location state
    const passedCartItems = location.state?.cartItems;
    
    if (passedCartItems) {
      // If items passed from previous page, use those
      setCartItems(passedCartItems);
      localStorage.setItem('cart', JSON.stringify(passedCartItems));
    } else {
      // Otherwise, try to load from localStorage
      const storedCart = JSON.parse(localStorage.getItem('cart')) || [];
      setCartItems(storedCart);
    }
    
    setLoading(false);
  }, [location.state]);

  const initClient = () => {
    gapi.load('client:auth2', () => {
      gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        scope: SCOPES
      }).then(() => {
        const authInstance = gapi.auth2.getAuthInstance() // 수정됨: null 검사 및 오류 처리 추가;
        if (authInstance && authInstance.isSignedIn.get()) {
          const currentUser = authInstance.currentUser.get();
          const profile = currentUser.getBasicProfile();
          const userInfo = {
            name: profile.getName(),
            email: profile.getEmail()
          };
          setUser(userInfo);
          localStorage.setItem('user', JSON.stringify(userInfo));
        }
      }).catch((error) => {
        console.error('Google API 초기화 실패:', error); 
      });
    });
  };

  // Image loading Effect
  useEffect(() => {
    const fetchImageUrls = async () => {
      const urls = {};
      for (const item of cartItems) {
        try {
          const url = await getImageURL(item.image);
          urls[item.id] = url;
        } catch (error) {
          console.error(`Error loading image for ${item.name}:`, error);
          urls[item.id] = null;
        }
      }
      setImageUrls(urls);
    };

    if (cartItems.length > 0) {
      fetchImageUrls();
    }
  }, [cartItems]);

  const createGoogleCalendarEvent = async () => {
    if (!user) {
      alert('먼저 Google 계정으로 로그인해주세요.');
      return;
    }

    try {
      // Create events for rental items
      const batch = cartItems.map(item => {
        return gapi.client.calendar.events.insert({
          calendarId: 'primary',
          resource: {
            summary: `DIRT 장비 대여: ${item.name}`,
            description: `대여 장비: ${item.name}\n카테고리: ${item.category}`,
            start: {
              dateTime: `${item.rentalDate}T${item.rentalTime}:00`,
              timeZone: 'Asia/Seoul'
            },
            end: {
              dateTime: `${item.returnDate}T${item.returnTime}:00`,
              timeZone: 'Asia/Seoul'
            },
            attendees: [
              { email: user.email }
            ]
          }
        });
      });

      // Execute all event creation requests
      await Promise.all(batch);

      // Clear cart on success
      localStorage.removeItem('cart');
      setCartItems([]);
      
      alert('모든 장비가 Google 캘린더에 예약되었습니다!');
    } catch (error) {
      console.error('Google Calendar 이벤트 생성 중 오류:', error);
      alert('캘린더 예약에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // 기존의 removeFromCart 함수 수정
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
  
  // Render user info for header
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
          <User size={16} />
          {user.name}님
        </div>
      );
    }
    return null;
  };

  // Render rental details for each cart item
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

  return (
    <div style={{
      position: 'relative',
      width: '1440px',
      height: '1700px',
      background: '#FFFFFF',
      margin: '0 auto',
      fontFamily: 'Pretendard, sans-serif',
      color: '#000000'
    }}>
      {/* Header Section */}
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
        {renderUserInfo()}
      </div>

      {/* Navigation and Logo Area */}
      <div style={{
        position: 'absolute',
        top: '150px',
        left: '50px',
        right: '50px'
      }}>
        <div style={{ 
          display: 'flex',
          position: 'absolute',
          gap: '20px',
          fontSize: '18px',
          fontWeight: '400',
          right: "16px",
          top: '45px'
        }}>
          <span>Home</span>
          <span>Calendar</span>
          <span>Reservation</span>
          <span>Note</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            position: 'absolute',
            fontSize: '36px', 
            fontWeight: 'bold', 
            letterSpacing: '0px',
            top: '0px',
            left: '70px'
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
            <span>My page</span>
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
            backgroundColor: '#f0f0f0'
          }}>
            <ShoppingCart size={20} />
            <span>Cart</span>
          </div>
        </div>
      </div>

      {/* Cart Content Area */}
      <div style={{
        position: 'absolute',
        top: '300px',
        left: '50px',
        right: '50px'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '20px' 
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
            <div style={{ 
              flex: 1, 
              border: '1px solid #E0E0E0', 
              borderRadius: '10px',
              padding: '20px',
              height: 'fit-content'
            }}>
              <h3 style={{ 
                fontSize: '20px', 
                fontWeight: 'bold', 
                marginBottom: '20px' 
              }}>
                예약 요약
              </h3>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                marginBottom: '20px',
                fontWeight: 'bold',
                fontSize: '18px'
              }}>
                <span>총 예약 장비 수</span>
                <span>{cartItems.length}개</span>
              </div>

              <button 
                onClick={createGoogleCalendarEvent}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: 'black',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                <CheckCircle size={20} />
                예약하기
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartPage;