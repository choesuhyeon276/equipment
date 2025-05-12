import React, { useEffect } from "react";
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ShoppingCart } from 'lucide-react';

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
  const handleCalendarNavigation = () => navigate('/calendar-with-header');
  const handleNoteNavigation = () => navigate('/thingsnote-with-header');
  const handleCartNavigation = () => navigate('/cart');
  const handleReservationNavigation = () => navigate('/reservation-main');
  
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

function CalendarWithHeader({ isMobile }) {
  useEffect(() => {
    const calendarId = "837ac43ba185f6e8b56e97f1f7e15ecbb103bc44c111e6b8c81fe28ec713b8e9@group.calendar.google.com";
    const embedUrl = `https://calendar.google.com/calendar/embed?src=${calendarId}&ctz=Asia/Seoul&mode=MONTH&showTitle=0&showPrint=0&showCalendars=0&showTabs=0&showDate=1&showNav=1&showTz=0&color=%23444444&bgcolor=%23FFFFFF`;
    
    const calendarIframe = document.getElementById("google-calendar");
    if (calendarIframe) {
      calendarIframe.src = embedUrl;
    }
  }, []);

  // 모바일 버전
  if (isMobile) {
    return (
      <div style={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: '#0F1316', 
        overflow: 'hidden',
      }}>
        {/* 모바일 헤더 */}
        <CommonHeader isMobile={true} />
        
        {/* 모바일 캘린더 내용 */}
        <div style={{
          padding: '20px 15px',
          color: '#FFFFFF',
          position: 'relative',
          zIndex: 1,
        }}>
          {/* KHDC 로고 배경 - 모바일 버전 */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            top: 0,
            left: 0,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: '0.3',
            zIndex: -1,
            overflow: 'hidden',
          }}>
            <img
              src="/assets/KHDC2.png"
              alt="KHDC Logo"
              style={{
                width: '200%',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          </div>

          <h2 style={{
            fontSize: '28px',
            fontWeight: '200',
            textAlign: 'center',
            marginTop: '10px',
            marginBottom: '20px',
          }}>
            Equipment Rental Status
          </h2>
          
          <div style={{
            width: '100%',
            height: 'calc(100vh - 170px)',
            backgroundColor: 'transparent',
            borderRadius: '10px',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 5,
          }}>
            <iframe
              id="google-calendar"
              title="Google Calendar"
              style={{
                width: '100%',
                height: '100%',
                border: '0',
                borderRadius: '10px',
                filter: "grayscale(50%)",
              }}
            ></iframe>
          </div>
        </div>
      </div>
    );
  }

  // 데스크탑 버전
  return (
    <div style={{
      width: '100%',
      backgroundColor: '#FFFFFF',
    }}>
      {/* 데스크탑 헤더 */}
      <CommonHeader isMobile={false} />

      {/* 캘린더 컨텐츠 */}
      <div style={{
        position: 'relative',
        width: '100vw',
        minHeight: '100vh',
        backgroundColor: '#FFFFFF',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        marginTop: '50px'
      }}>
        <div style={{
          minWidth: '1440px',
          height: '940px',
          backgroundColor: '#0F1316',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          margin: 'auto',
          overflow: 'hidden'
        }}>
          {/* KHDC 로고 배경 */}
          <div style={{
            position: 'absolute',
            width: '110%',
            height: '100%',
            scale: "200%",
            left: '320px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            opacity: '0.5',
            zIndex: '2',
            overflow: 'hidden',
          }}>
            <img
              src="/assets/KHDC2.png"
              alt="KHDC Logo"
              style={{
                width: '2000px',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          </div>

          {/* 타이틀 영역 */}
          <div style={{
            textAlign: 'center',
            borderRadius: '10px',
            width: '100%',
            maxWidth: '1440px',
            margin: '0 auto',
            zIndex: '2'
          }}>
            <h2 style={{
              position: 'absolute',
              top: '10px',
              left: '710px',
              transform: 'translateX(-50%)',
              fontSize: '90px',
              fontWeight: '100',
              color: 'white',
              whiteSpace: 'nowrap',
            }}>Equipment Rental Status Calendar</h2>
            <h3 style={{
              position: 'absolute',
              top: '120px',
              left: '200px',
              transform: 'translateX(-50%)',
              fontSize: '90px',
              fontWeight: '100',
              color: 'white',
            }}></h3>
          </div>

          {/* 구글 캘린더 */}
          <div style={{
            marginTop: '30px',
            backgroundColor: 'transparent',
            borderRadius: '20px',
            padding: '20px',
            width: '100%',
            maxWidth: '1200px',
            margin: '0 auto',
            zIndex: '3'
          }}>
            <iframe
              id="google-calendar"
              title="Google Calendar"
              style={{
                width: '100%',
                height: '750px',
                border: '0',
                borderRadius: '20px',
                filter: "grayscale(50%)",
                margin: "-1px",
                padding: "1px",
                backgroundColor: "transparent",
              }}
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarWithHeader;