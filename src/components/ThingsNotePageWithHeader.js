// src/components/ThingsNotePageWithHeader.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, ShoppingCart, MessageCircle } from 'lucide-react';

// 실시간 설정 구독 유틸 (경로 주의: src/utils/adminSettings.js)
import { DEFAULT_SETTINGS, subscribeAdminSettings } from '../utils/adminSettings.js';

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
          color: '#000000',
          display: 'flex',
          position: 'absolute',
          right: '110px',
          top: '0px',
          alignItems: 'center', 
          gap: '5px', 
          cursor: 'pointer',
          padding: '5px 10px',
          borderRadius: '20px',
          backgroundColor: '#f0f0f0',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
        }} onClick={() => navigate('/mypage')}>
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
        }} onClick={() => navigate('/cart')}>
          <ShoppingCart size={20} />
          <span>Cart</span>
        </div>
      </div>
    </div>
  );
};

const ThingsNotePageWithHeader = ({ isMobile }) => {
  // 공용 설정 실시간 구독 상태
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  useEffect(() => {
    // 저장 시 자동 반영(onSnapshot)
    const unsub = subscribeAdminSettings(setSettings);
    return () => unsub();
  }, []);

  // 카카오톡 오픈채팅 링크 클릭 핸들러
  const handleKakaoClick = () => {
    if (settings.kakaoOpenChatUrl) {
      window.open(settings.kakaoOpenChatUrl, '_blank');
    }
  };

  // 카카오톡 아이콘 컴포넌트 (클릭 가능한 경우와 아닌 경우)
  const KakaoIcon = ({ size = 24, clickable = false }) => {
    const iconStyle = {
      width: `${size}px`,
      height: `${size}px`,
      backgroundColor: '#FEE500',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: clickable && settings.kakaoOpenChatUrl ? 'pointer' : 'default',
      opacity: clickable && !settings.kakaoOpenChatUrl ? 0.3 : 1,
      transition: 'all 0.2s ease',
      boxShadow: clickable ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
    };

    const hoverStyle = clickable && settings.kakaoOpenChatUrl ? {
      transform: 'scale(1.05)',
      boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
    } : {};

    return (
      <div 
        style={iconStyle}
        onClick={clickable ? handleKakaoClick : undefined}
        onMouseEnter={clickable ? (e) => Object.assign(e.target.style, hoverStyle) : undefined}
        onMouseLeave={clickable ? (e) => Object.assign(e.target.style, iconStyle) : undefined}
        title={clickable && settings.kakaoOpenChatUrl ? '카카오톡 오픈채팅 참여하기' : ''}
      >
        <MessageCircle size={size * 0.6} color="#3C1E1E" />
      </div>
    );
  };

  // 모바일 버전 렌더링
  if (isMobile) {
    return (
      <div style={{
        width: '100%',
        backgroundColor: '#000',
        overflow: 'hidden',
        minHeight: '100vh',
      }}>
        {/* 모바일 헤더 */}
        <CommonHeader isMobile={true} />
        
        {/* 모바일 컨텐츠 */}
        <div style={{
          width: '100%',
          position: 'relative',
          color: '#ffffff',
          fontFamily: 'Pretendard, sans-serif',
          padding: '20px 15px 60px 15px',
        }}>
          {/* 중앙 "Things Note:" 제목 - 모바일 */}
          <div style={{
            marginTop: '0px',
            marginBottom: '30px',
            fontSize: '48px',
            fontWeight: 'bold',
            lineHeight: '1.06',
            background: 'linear-gradient(to right, #ffffff, #aaaaaa)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: '0 0 10px rgba(255,255,255,0.2)',
            textAlign: 'center',
          }}>
            Things Note:
          </div>

          {/* 카드형 정보 영역 - 모바일 */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
            marginTop: '20px',
          }}>
            {/* 카드 1 - 장비장 연락망 */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
              borderLeft: '3px solid #ff9500',
            }}>
              <div style={{ 
                fontWeight: '600', 
                marginBottom: '8px', 
                color: '#ff9500',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <span>장비장 연락망</span>
                {settings.kakaoOpenChatUrl && (
                  <KakaoIcon size={24} clickable={true} />
                )}
              </div>
              <div style={{ 
                lineHeight: '1.5', 
                fontWeight: '300',
                fontSize: '14px',
              }}>
                {settings.adminName}<br />
                {settings.adminPhone}
              </div>
            </div>

            {settings.notesCards.map((card, idx) => (
              <div key={idx} style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '10px',
                padding: '16px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                borderLeft: `3px solid ${card.color}`,
              }}>
                <div style={{
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: card.color,
                  fontSize: '16px',
                }}>{card.title}</div>
                <div style={{
                  lineHeight: '1.5',
                  fontWeight: '300',
                  fontSize: '14px',
                  whiteSpace: 'pre-line'
                }}>
                  {card.content}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 데스크탑 버전
  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
    }}>
      {/* 데스크탑 헤더 */}
      <CommonHeader isMobile={false} />

      {/* ThingsNote 컨텐츠 */}
      <div style={{
        width: '100vw',
        height: '910px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        marginTop: '50px',
      }}>
        <div style={{
          width: '1440px',
          height: '1080px',
          position: 'relative',
          backgroundColor: '#000',
          color: '#ffffff',
          fontFamily: 'Pretendard, sans-serif',
        }}>
          {/* 상단 정보영역 */}
          <div style={{
            position: 'absolute',
            top: '100px',
            left: '60px',
            right: '60px',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '16px',
            paddingBottom: '20px',
            overflow: 'hidden',
            whiteSpace: 'nowrap'
          }}>
            <div style={{
              position: 'absolute',
              width: '100%',
              height: '1px',
              backgroundColor: 'white',
              top: '25px'
            }}></div>

            <div>
              <div style={{ 
                fontWeight: '200', 
                marginBottom: '5px', 
                position: 'absolute', 
                left: '2px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}>
                장비장 연락망
                {settings.kakaoOpenChatUrl && (
                  <KakaoIcon size={20} clickable={true} />
                )}
              </div>
              <div style={{ lineHeight: '1.2', position: 'absolute', left: '2px', top: '30px', fontWeight: '200' }}>
                {settings.adminName}<br />
                {settings.adminPhone}
              </div>
            </div>
            <div style={{
              fontWeight: '200',
              width: '0px',
              height: '4px',
              backgroundColor: 'white',
              margin: '0 0px'
            }} />
            <div>
              <div style={{ fontWeight: '200', position: 'absolute', left: '300px' }}>
                {settings.notesCards[0]?.title ?? '대여일'}
              </div>
              <div style={{ lineHeight: '1.2', position: 'absolute', left: '300px', top: '30px', fontWeight: '200', whiteSpace: 'pre-line' }}>
                {settings.notesCards[0]?.content ?? ''}
              </div>
            </div>
            <div style={{ width: '0px', height: '60px', backgroundColor: 'white', margin: '0 20px' }} />
            <div>
              <div style={{ fontWeight: '200', position: 'absolute', left: '650px' }}>
                {settings.notesCards[1]?.title ?? '반납시'}
              </div>
              <div style={{ lineHeight: '1.2', fontWeight: '200', position: 'absolute', left: '650px', top: '30px', whiteSpace: 'pre-line' }}>
                {settings.notesCards[1]?.content ?? ''}
              </div>
            </div>
            <div style={{ width: '0px', height: '60px', backgroundColor: 'white' }} />
            <div>
              <div style={{ fontWeight: '200' }}>
                {settings.notesCards[2]?.title ?? '방학 중 장비 대여 안내'}
              </div>
              <div style={{ lineHeight: '1.2', fontWeight: '200', whiteSpace: 'pre-line' }}>
                {settings.notesCards[2]?.content ?? ''}
              </div>
            </div>
          </div>

          {/* 중앙 "Things Note:" 제목 */}
          <div style={{
            position: 'absolute',
            left: '60px',
            bottom: '250px',
            fontSize: '320px',
            fontWeight: 'bold',
            lineHeight: '77%'
          }}>
            Things<br />
            Note:
          </div>

          {/* 배경 이미지 디자인 */}
          <div style={{
            position: 'absolute',
            right: '-50px',
            bottom: '-50px',
            width: '900px',
            height: '900px',
            opacity: '1',
            backgroundImage: `url(${process.env.PUBLIC_URL}/assets/warning.png)`,
            backgroundSize: 'contain',
            backgroundRepeat: 'no-repeat',
            userSelect: 'none',
            pointerEvents: 'none'
          }} />
        </div>
      </div>
    </div>
  );
};

export default ThingsNotePageWithHeader;