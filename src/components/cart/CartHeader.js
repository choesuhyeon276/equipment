import React from 'react';
import { User, ShoppingCart } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

// NavItem 컴포넌트 - 모바일용
const NavItem = ({ children, active, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      padding: '5px 0',
      width: '25%',
      fontSize: '12px',
      fontWeight: active ? '700' : '400',
      color: active ? '#fff' : '#aaa',
      borderBottom: active ? '2px solid #fff' : 'none',
      cursor: 'pointer',
      position: 'relative',
      textAlign: 'center'
    }}
  >
    {children}
  </div>
);

// 공통 헤더 컴포넌트
const CommonHeader = ({ isMobile }) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 현재 경로 기반으로 활성 페이지 확인
  const isHomePage = location.pathname === '/main';
  const isCalendarPage = location.pathname.includes('calendar');
  const isNotePage = location.pathname.includes('thingsnote');
  const isReservationPage = location.pathname.includes('reservation') || location.pathname.includes('Reservation');
  const isMyPage = location.pathname.includes('mypage');
  const isCartPage = location.pathname.includes('cart');

  // 내비게이션 핸들러
  const handleHomeNavigation = () => navigate('/main');
  const handleMyPageNavigation = () => navigate('/mypage');
  const handleCalendarNavigation = () => navigate('/calendar-with-header', { state: { scrollTo: 'calendar-section' } });
  const handleNoteNavigation = () => navigate('/thingsnote-with-header', { state: { scrollTo: 'notes-section' } });
  const handleCartNavigation = () => navigate('/cart');
  const handleReservationNavigation = () => navigate('/ReservationMainPage');
  
  // 모바일 버전 헤더
  if (isMobile) {
    return (
      <div style={{
        width: '100%',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: '#000',
        color: '#fff'
      }}>
        {/* 상단 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          borderBottom: '1px solid #333'
        }}>
          {/* 로고 */}
          <div 
            onClick={handleHomeNavigation} 
            style={{
              fontSize: '20px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            DKit
          </div>
          
          {/* 상단 우측 아이콘 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            {/* 마이페이지 버튼 */}
            <div style={{ position: 'relative' }}>
              <User 
                size={18}
                color={isMyPage ? "#1a6cff" : "#fff"}
                style={{ cursor: 'pointer' }}
                onClick={handleMyPageNavigation}
              />
              {isMyPage && (
                <span style={{
                  position: 'absolute',
                  bottom: '-4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  backgroundColor: '#1a6cff',
                  borderRadius: '50%',
                }}></span>
              )}
            </div>
            
            {/* 장바구니 버튼 */}
            <div style={{ position: 'relative' }}>
              <ShoppingCart 
                size={18}
                color={isCartPage ? "#1a6cff" : "#fff"}
                style={{ cursor: 'pointer' }}
                onClick={handleCartNavigation}
              />
              {isCartPage && (
                <span style={{
                  position: 'absolute',
                  bottom: '-4px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '4px',
                  height: '4px',
                  backgroundColor: '#1a6cff',
                  borderRadius: '50%',
                }}></span>
              )}
            </div>
          </div>
        </div>
        
        {/* 메인 네비게이션 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
          padding: '0',
          backgroundColor: '#000',
          color: '#fff'
        }}>
          <NavItem active={isHomePage} onClick={handleHomeNavigation}>Home</NavItem>
          <NavItem active={isCalendarPage} onClick={handleCalendarNavigation}>Calendar</NavItem>
          <NavItem active={isNotePage} onClick={handleNoteNavigation}>Note</NavItem>
          <NavItem active={isReservationPage} onClick={handleReservationNavigation}>Reservation</NavItem>
        </div>
      </div>
    );
  }

  // 데스크탑 버전 헤더
  return (
    <div style={{
      position: 'sticky',
      top: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: '0px solid #5F5F5F',
      paddingBottom: '45px',
      width: '100%',
      maxWidth: '1440px',
      margin: '0 auto',
    }}>
      <div style={{ 
        display: 'flex',
        position: 'absolute',
        gap: '20px',
        fontSize: '18px',
        fontWeight: '400',
        right: "16px",
        top: '45px',
        color: '#000000'
      }}>
        <span 
          onClick={handleHomeNavigation} 
          style={{ 
            cursor: 'pointer',
            fontWeight: isHomePage ? '700' : '400'
          }}
        >
          Home
        </span>
        <span 
          onClick={handleCalendarNavigation} 
          style={{ 
            cursor: 'pointer',
            fontWeight: isCalendarPage ? '700' : '400'
          }}
        >
          Calendar
        </span>
        <span 
          onClick={handleNoteNavigation} 
          style={{ 
            cursor: 'pointer',
            fontWeight: isNotePage ? '700' : '400'
          }}
        >
          Note
        </span>
        <span 
          onClick={handleReservationNavigation} 
          style={{ 
            cursor: 'pointer',
            fontWeight: isReservationPage ? '700' : '400'
          }}
        >
          Reservation
        </span>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div onClick={handleHomeNavigation} style={{ 
          position: 'absolute',
          fontSize: '36px', 
          fontWeight: 'bold', 
          letterSpacing: '0px',
          top: '0px',
          left: '70px',
          cursor: 'pointer',
          color: '#000000'
        }}>DKit</div>
        <div style={{ 
          fontSize: '12px', 
          color: '#000000',
          position: 'absolute',
          left: '110px',
          top: '40px',
          transform: 'translateX(-50%)',
          whiteSpace: 'nowrap',
          fontWeight: '100'
        }}>Digital Contents rental service</div>
      </div>
      
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        {/* My page button */}
        <div style={{ 
          color: isMyPage ? '#FFFFFF' : '#000000',
          display: 'flex',
          position: 'absolute',
          right: '110px',
          top: '0px',
          alignItems: 'center', 
          gap: '5px', 
          cursor: 'pointer',
          padding: '5px 10px',
          borderRadius: '20px',
          backgroundColor: isMyPage ? '#212121' : '#f0f0f0',
          boxShadow: isMyPage ? 'none' : '0 4px 6px rgba(0, 0, 0, 0.2)',
        }} onClick={handleMyPageNavigation}>
          <User size={20} />
          <span>My page</span>
        </div>
        
        {/* Cart button */}
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
          backgroundColor: isCartPage ? '#212121' : '#f0f0f0',
          boxShadow: isCartPage ? 'none' : '0 4px 6px rgba(0, 0, 0, 0.2)',
          color: isCartPage ? '#FFFFFF' : '#000000'
        }} onClick={handleCartNavigation}>
          <ShoppingCart size={20} />
          <span>Cart</span>
        </div>
      </div>
    </div>
  );
};

// CartHeader 컴포넌트는 이제 CommonHeader를 사용
const CartHeader = ({ isMobile }) => {
  return <CommonHeader isMobile={isMobile} />;
};

export default CartHeader;