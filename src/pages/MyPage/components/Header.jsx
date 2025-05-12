// src/pages/MyPage/components/Header.jsx
import React from 'react';
import { User, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Header = ({ user, isMobile }) => {
  const navigate = useNavigate();

  // 내비게이션 핸들러
  const handleHomeNavigation = () => navigate('/main');
  const handleCalendarNavigation = () => navigate('/calendar-with-header', { state: { scrollTo: 'calendar-section' } });
  const handleNoteNavigation = () => navigate('/thingsnote-with-header', { state: { scrollTo: 'notes-section' } });
  const handleCartNavigation = () => navigate('/cart');
  const handleReservateNavigation = () => navigate('/ReservationMainPage');

  // 모바일 버전 헤더 (무신사 스타일로 수정)
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
        {/* 상단 헤더 - 높이 축소 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 16px',
          borderBottom: '1px solid #333'
        }}>
          {/* 로고 - 폰트 크기 축소 */}
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
            {/* 마이페이지 버튼 - 아이콘 크기 축소 (활성화된 상태) */}
            <div style={{ position: 'relative' }}>
              <User 
                size={18}
                color="#1a6cff"
                style={{ cursor: 'pointer' }}
              />
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
            </div>
            
            {/* 장바구니 버튼 - 아이콘 크기 축소 */}
            <div style={{ position: 'relative' }}>
              <ShoppingCart 
                size={18}
                color="white" 
                onClick={handleCartNavigation}
                style={{ cursor: 'pointer' }}
              />
            </div>
          </div>
        </div>
        
        {/* 메인 네비게이션 - 4개 유지 */}
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
          <NavItem active={false} onClick={handleHomeNavigation}>Home</NavItem>
          <NavItem active={false} onClick={handleCalendarNavigation}>Calendar</NavItem>
          <NavItem active={false} onClick={handleNoteNavigation}>Note</NavItem>
          <NavItem active={false} onClick={handleReservateNavigation}>Reservation</NavItem>
        </div>
      </div>
    );
  }

  // 데스크톱 버전 - 원래 디자인 완전히 유지
  return (
    <div style={{
      position: 'sticky',
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
        right: "16px",
        top: '45px',
        color: '#000000'
      }}>
        <span onClick={handleHomeNavigation} style={{ cursor: 'pointer' }}>Home</span>
        <span onClick={handleCalendarNavigation} style={{ cursor: 'pointer' }}>Calendar</span>
        <span onClick={handleNoteNavigation} style={{ cursor: 'pointer' }}>Note</span>
        <span onClick={handleReservateNavigation} style={{ cursor: 'pointer' }}>Reservation</span>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div onClick={handleHomeNavigation}  style={{ 
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
          color: '#FFFFFF',
          display: 'flex',
          position: 'absolute',
          right: '110px',
          top: '0px',
          alignItems: 'center', 
          gap: '5px', 
          cursor: 'pointer',
          padding: '5px 10px',
          borderRadius: '20px',
          backgroundColor: '#212121',
        }}>
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
          backgroundColor: '#f0f0f0',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
          color: '#000000'
        }}
          onClick={handleCartNavigation}
        >
          <ShoppingCart size={20} />
          <span>Cart</span>
        </div>
      </div>
    </div>
  );
};

// NavItem 컴포넌트 - 메뉴용 (모바일)
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

export default Header;