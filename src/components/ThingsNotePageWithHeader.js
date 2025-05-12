import React from 'react';
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

const ThingsNotePageWithHeader = ({ isMobile }) => {
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
            {/* 카드 1 */}
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
              }}>장비장 연락처</div>
              <div style={{ 
                lineHeight: '1.5', 
                fontWeight: '300',
                fontSize: '14px',
              }}>
                김나영<br />
                010-7667-9373
              </div>
            </div>

            {/* 카드 2 */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
              borderLeft: '3px solid #00bcd4',
            }}>
              <div style={{ 
                fontWeight: '600', 
                marginBottom: '8px', 
                color: '#00bcd4',
                fontSize: '16px',
              }}>대여일</div>
              <div style={{ 
                lineHeight: '1.5', 
                fontWeight: '300',
                fontSize: '14px',
              }}>
                • 대여일 1일 전에는 신청하기<br />
                • 당일 대여 불가<br />
                • 평일 9:00 - 17:00 동안 장비 수령 가능
              </div>
            </div>

            {/* 카드 3 */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
              borderLeft: '3px solid #f44336',
            }}>
              <div style={{ 
                fontWeight: '600', 
                marginBottom: '8px', 
                color: '#f44336',
                fontSize: '16px',
              }}>반납시</div>
              <div style={{ 
                lineHeight: '1.5', 
                fontWeight: '300',
                fontSize: '14px',
              }}>
                마이페이지에 현재 대여 장비란에<br />
                장비가 나온 반납사진 첨부하여 반납신청하기
              </div>
            </div>

            {/* 카드 4 */}
            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '10px',
              padding: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
              borderLeft: '3px solid #4caf50',
            }}>
              <div style={{ 
                fontWeight: '600', 
                marginBottom: '8px', 
                color: '#4caf50',
                fontSize: '16px',
              }}>방학중 장비 대여 안내</div>
              <div style={{ 
                lineHeight: '1.5', 
                fontWeight: '300',
                fontSize: '14px',
              }}>
                • 장비 교육 수료 여부와 없이<br />
                • 디지털콘텐츠학과 학생이면 대여가 가능합니다.<br />
                • 사무실은 9:00 - 15:00시까지 운영됩니다.
              </div>
            </div>
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
              <div style={{ fontWeight: '200', marginBottom: '5px', position: 'absolute', left: '2px' }}>장비장 연락처</div>
              <div style={{ lineHeight: '1.2', position: 'absolute', left: '2px', top: '30px', fontWeight: '200', }}>
                김나영<br />
                010-7667-9373
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
              <div style={{ fontWeight: '200', position: 'absolute', left: '300px' }}>대여일</div>
              <div style={{ lineHeight: '1.2', position: 'absolute', left: '300px', top: '30px', fontWeight: '200', }}>
                대여일 1일 전에는 신청하기<br />
                당일 대여 불가<br />
                평일 9:00 - 17:00 동안 장비 수령 가능
              </div>
            </div>
            <div style={{
              width: '0px',
              height: '60px',
              backgroundColor: 'white',
              margin: '0 20px'
            }} />
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px', fontWeight: '200', position: 'absolute', left: '650px' }}>반납시</div>
              <div style={{ lineHeight: '1.2', fontWeight: '200', position: 'absolute', left: '650px', top: '30px' }}>
                마이페이지에 현재 대여 장비란에<br />
                장비가 나온 반납사진 첨부하여 반납신청하기<br />
              </div>
            </div>
            <div style={{
              width: '0px',
              height: '60px',
              backgroundColor: 'white',
            }} />
            <div>
              <div style={{ fontWeight: 'bold', marginBottom: '5px', fontWeight: '200' }}>방학중 장비 대여 안내</div>
              <div style={{ lineHeight: '1.2', fontWeight: '200', }}>
                장비 교육 수료 여부와 없이<br />
                디지털콘텐츠학과 학생이면 대여가 가능합니다.<br />
                사무실은 9:00 - 15:00시까지 운영됩니다.
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