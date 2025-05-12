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
      textAlign: 'center',
      
    }}
  >
    {children}
  </div>
);

// 공통 헤더 컴포넌트 - 장바구니 카운트 및 애니메이션 기능 추가
const CommonHeader = ({ 
  isMobile, 
  cartItemCount = 0, 
  cartAnimation = false,
  specificPage = '' // 특정 페이지를 강제로 활성화하기 위한 옵션
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // 현재 경로 기반으로 활성 페이지 확인
  const isHomePage = specificPage === 'home' || (specificPage === '' && location.pathname === '/main');
  const isCalendarPage = specificPage === 'calendar' || (specificPage === '' && location.pathname.includes('calendar'));
  const isNotePage = specificPage === 'note' || (specificPage === '' && location.pathname.includes('thingsnote'));
  const isReservationPage = specificPage === 'reservation' || (specificPage === '' && (location.pathname.includes('reservation') || location.pathname.includes('Reservation')));
  const isMyPage = specificPage === 'mypage' || (specificPage === '' && location.pathname.includes('mypage'));
  const isCartPage = specificPage === 'cart' || (specificPage === '' && location.pathname.includes('cart'));

  // 내비게이션 핸들러
  const handleHomeNavigation = () => navigate('/main');
  const handleMyPageNavigation = () => navigate('/mypage');
  const handleCalendarNavigation = () => navigate('/calendar-with-header', { state: { scrollTo: 'calendar-section' } });
  const handleNoteNavigation = () => navigate('/thingsnote-with-header', { state: { scrollTo: 'notes-section' } });
  const handleCartNavigation = () => navigate('/cart');
  const handleReservationNavigation = () => navigate('/ReservationMainPage');

  // 장바구니 아이콘 렌더링 (데스크탑)
  const renderCartIcon = () => (
    <div 
      style={{ 
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
        color: isCartPage ? '#FFFFFF' : '#000000',
        transition: 'transform 0.3s',
        fontWeight: '500'
      }}
      onClick={handleCartNavigation}
      className={cartAnimation ? 'cart-bounce' : ''}
    >
      <div style={{ position: 'relative' }}>
        <ShoppingCart size={20}/>
        {cartItemCount > 0 && (
          <span style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            backgroundColor: 'red',
            color: 'white',
            borderRadius: '50%',
            width: '16px',
            height: '16px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            fontSize: '12px',
          }}>
            {cartItemCount}
          </span>
        )}
      </div>
      <span>Cart</span>
    </div>
  );
  
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
                className={cartAnimation ? 'cart-bounce' : ''}
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
              {cartItemCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-6px',
                  right: '-6px',
                  backgroundColor: '#1a6cff',
                  color: 'white',
                  borderRadius: '50%',
                  width: '16px',
                  height: '16px',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  fontSize: '9px',
                  fontWeight: 'bold'
                }}>
                  {cartItemCount}
                </span>
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
      marginBottom: '50px'
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
          fontWeight: '500'
        }} onClick={handleMyPageNavigation}>
          <User size={20} />
          <span>My page</span>
        </div>
        
        {/* Cart button */}
        {renderCartIcon()}
      </div>
    </div>
  );
};

// Header 컴포넌트는 이제 CommonHeader를 사용
const Header = ({ 
  isMobile, 
  handleHomeNavigation, 
  handleMyPageNavigation, 
  handleCalendarNavigation, 
  handleNoteNavigation, 
  handleCartNavigation, 
  cartItemCount,
  cartAnimation
}) => {
  // 예전 방식의 handlers를 받아서 처리하기 위한 작업
  // 이 부분은 기존 코드와의 호환성을 위해 필요합니다
  if (handleHomeNavigation || handleMyPageNavigation || handleCartNavigation) {
    // 모든 핸들러가 제공되었다면, 원래의 헤더 컴포넌트처럼 작동
    return (
      <CommonHeader 
        isMobile={isMobile} 
        cartItemCount={cartItemCount} 
        cartAnimation={cartAnimation}
        specificPage="reservation" // 기존 코드에서는 Reservation이 항상 활성화되어 있었습니다
      />
    );
  }
  
  // 기본적으로는 공통 헤더 사용
  return <CommonHeader isMobile={isMobile} cartItemCount={cartItemCount} cartAnimation={cartAnimation} />;
};

export default Header;