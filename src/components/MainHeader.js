import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from "../firebase/firebaseConfig";
import { toast } from 'react-toastify';

function MainHeader() {
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 768 && window.innerWidth <= 1024);
  
  const navigate = useNavigate();

const [logoClickCount, setLogoClickCount] = useState(0);

const handleLogoClick = () => {
  const newCount = logoClickCount + 1;
  setLogoClickCount(newCount);
  if (newCount >= 5) {
    setLogoClickCount(0);
    navigate('/admins');
  }
};
  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      setIsMobile(w <= 768);
      setIsTablet(w > 768 && w <= 1024);
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 로그인 상태 확인
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsLoggedIn(true);
        setUserName(user.displayName || user.email.split('@')[0]);
      } else {
        setIsLoggedIn(false);
        setUserName('');
      }
    });
    return () => unsubscribe();
  }, []);

  // 스크롤 위치 추적 및 버튼 표시 로직
  useEffect(() => {
    const toggleVisibility = () => {
      // 화면 높이의 300px 이상 스크롤되면 버튼 표시
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // 스크롤 이벤트 리스너 추가
    window.addEventListener('scroll', toggleVisibility);

    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  // 로그인 페이지로 이동
 const handleLogin = () => {
   // 로그인 후 돌아올 위치를 기억하고 싶으면 state로 from 전달 가능
   navigate('/login', { state: { from: '/reservation' } });
 };

  // 로그아웃 처리 함수
  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.clear(); // 혹시 계정 바꿔 로그인 원하면 이것도 있어야 함
      toast.success("👋 로그아웃되었습니다!");
      setIsLoggedIn(false);
    } catch (error) {
      console.error("로그아웃 실패: ", error.message);
      toast.error("🚨 로그아웃 중 문제가 발생했습니다.");
    }
  };

  // 예약 페이지로 이동하는 함수
  const handleReservation = () => {
   // 라우터에 등록된 경로로 정확히 이동 (소문자 권장)
   navigate('/reservation'); // 또는 '/reservationMainPage' 정확히 소문자 r
   setTimeout(() => {
     window.scrollTo(0, 0);
   }, 100);
 };

  // 맨 위로 스크롤하는 함수
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // 버튼 호버 효과를 위한 상태 변수
  const [reserveHover, setReserveHover] = useState(false);
  const [returnHover, setReturnHover] = useState(false);
  const [scrollTopHover, setScrollTopHover] = useState(false);

 // 메인 컨테이너 스타일 - 높이 조정
const mainContainerStyle = {
  position: 'relative',
  width: '100%',
  height: isMobile ? '480px' : isTablet ? '700px' : '830px', // 모바일 높이 증가
  minHeight: isMobile ? '480px' : null, // 모바일 최소 높이 설정
  backgroundColor: '#FFFFFF',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  overflow: 'hidden',
  border: '0px solid black',
  minWidth: isMobile ? 'auto' : '1440px',
};

// 내부 컨테이너 스타일 - 높이 조정
const innerContainerStyle = {
  width: isMobile ? '100%' : '1440px',
  height: isMobile ? '500px' : isTablet ? '700px' : '1080px', // 모바일 높이 증가
  backgroundColor: '#F1F1F1',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  position: 'relative',
  margin: 'auto',
  overflow: 'hidden',
  padding: isMobile ? '20px 0' : '0',
};

  // 로고 컨테이너 스타일
  const logoContainerStyle = {
    position: 'absolute',
    top: isMobile ? '10px' : '20px',
    left: isMobile ? '10px' : '10px',
    transform: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    zIndex: 5,
  };

  // 로고 이미지 스타일
  const logoStyle = {
    width: isMobile ? '40px' : '96px',
    height: isMobile ? '23px' : '54px',
    objectFit: 'contain',
    display: 'block',
    margin: '0',
    padding: '0',
  };

  // 로고 텍스트 스타일
  const logoTextStyle = {
    position: 'absolute',
    left: isMobile ? '35px' : '81px',
    color: 'black',
    fontSize: isMobile ? '10px' : '16px',
    fontWeight: '500',
    whiteSpace: 'nowrap',
  };

  // 로그인 버튼 컨테이너 스타일
  const loginContainerStyle = {
    position: 'absolute',
    top: isMobile ? '40px' : '40px',
    right: isMobile ? '15px' : '60px',
    transform: 'none',
    color: 'black',
    fontSize: isMobile ? '12px' : '18px',
    fontWeight: '400',
    cursor: 'pointer',
    zIndex: '5',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  };

  // 배경 텍스트 스타일 - 모바일에서는 더 적절한 크기로
  const backgroundTextStyle = {
    position: 'absolute',
    top: isMobile ? '18%' : isTablet ? '12%' : '14%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    color: '#CCCCCC',
    fontSize: isMobile ? '40px' : isTablet ? '100px' : '190px',
    fontWeight: 'bold',
    opacity: '0.4',
    zIndex: '0',
    whiteSpace: 'nowrap',
    textAlign: 'center',
    width: '100%',
  };

  // 메인 타이틀 1 스타일 - 모바일에서 위치 조정
  const mainTitle1Style = {
    position: 'absolute',
    top: isMobile ? '90px' : isTablet ? '140px' : '160px',
    
    left: isMobile ? '50%' : isTablet ? 'auto' : 'auto', 
    transform: isMobile ? 'translateX(-50%)' : 'none',
    textAlign: isMobile ? 'center' : 'right',
    marginLeft: isMobile ? '0' : isTablet ? '350px' : '670px',
    marginBottom: '15px',
    zIndex: '1',
  };

  // 메인 타이틀 1 텍스트 스타일 - 모바일에서 크기 최적화
  const mainTitle1TextStyle = {
    color: 'black',
    fontSize: isMobile ? '42px' : isTablet ? '100px' : '170px',
    fontWeight: '900',
    lineHeight: isMobile ? '50px' : isTablet ? '80px' : '115px',
    textAlign: isMobile ? 'center' : 'right',
  };

  // 메인 타이틀 2 스타일 - 모바일에서 간격 최적화
  const mainTitle2Style = {
    position: 'absolute',
    top: isMobile ? '135px' : isTablet ? '220px' : '288px',
    left: isMobile ? '50%' : isTablet ? 'auto' : '182px',
    transform: isMobile ? 'translateX(-50%)' : 'none',
    textAlign: isMobile ? 'center' : 'left',
    zIndex: '1',
    width: isMobile ? '100%' : 'auto',
  };

  // 메인 타이틀 2 텍스트 스타일 - 모바일에서 깔끔한 크기로
  const mainTitle2TextStyle = {
    color: 'black',
    fontSize: isMobile ? '28px' : isTablet ? '80px' : '170px',
    fontWeight: '900',
    lineHeight: isMobile ? '34px' : isTablet ? '90px' : '180px',
    textAlign: isMobile ? 'center' : 'left',
  };

  // 부제목 스타일 - 모바일에서 위치 조정
  const subtitleStyle = {
    position: 'absolute',
    top: isMobile ? '220px' : 'auto',
    left: isMobile ? '50%' : isTablet ? '100px' : '400px',
    transform: isMobile ? 'translateX(-50%)' : 'none',
    marginTop: isMobile ? '-40px' : '80px',
    zIndex: '1',
    width: isMobile ? '100%' : 'auto',
  };

  // 부제목 텍스트 스타일 - 모바일에서 깔끔하게 조정
  const subtitleTextStyle = {
    color: 'black',
    fontSize: isMobile ? '20px' : isTablet ? '50px' : '80px',
    fontWeight: '100',
    lineHeight: isMobile ? '26px' : isTablet ? '60px' : '110px',
    textAlign: isMobile ? 'center' : 'left',
  };

  // 구분선 스타일 - 모바일에서 위치와 크기 조정
  const dividerStyle = {
    position: 'absolute',
    width: isMobile ? '80%' : isTablet ? '70%' : '780px',
    height: isMobile ? '2px' : '3px',
    backgroundColor: 'black',
    top: isMobile ? '210px' : 'auto',
    left: isMobile ? '10%' : isTablet ? '100px' : '480px',
    marginTop: isMobile ? '0' : '100px',
  };

  // 안내 문구 스타일 - 모바일에서 위치 최적화
  const noticeStyle = {
    position: 'absolute',
    top: isMobile ? '230px' : '430px',
    left: isMobile ? '50%' : '700px',
    transform: isMobile ? 'translateX(-50%)' : 'none',
    width: isMobile ? '85%' : 'auto',
    marginLeft: isMobile ? '0' : isTablet ? '-300px' : '-650px',
    marginTop: isMobile ? '0' : isTablet ? '300px' : '300px',
    textAlign: isMobile ? 'center' : 'left',
  };

  // 안내 문구 텍스트 스타일 - 더 읽기 쉽게
  const noticeTextStyle = {
    color: 'black',
    fontSize: isMobile ? '12px' : isTablet ? '14px' : '18px',
    fontWeight: '500',
    lineHeight: '1.5',
    textAlign: isMobile ? 'center' : 'left',
    backgroundColor: isMobile ? 'rgba(255, 255, 255, 0.7)' : 'transparent',
    padding: isMobile ? '10px' : '0',
    borderRadius: isMobile ? '8px' : '0',
  };

  // 버튼 그룹 스타일 - 모바일에서 위치 최적화
  const buttonGroupStyle = {
    position: 'absolute',
    top: isMobile ? '330px' : isTablet ? '600px' : '660px', // 모바일에서 더 아래로 배치
    left: isMobile ? '50%' : isTablet ? '600px' : '1150px',
    transform: 'translateX(-50%)',
    display: 'flex',
    flexDirection: isMobile ? 'column' : 'row',
    gap: isMobile ? '15px' : '20px',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    width: isMobile ? '90%' : '100%', // 모바일에서 너비 제한
    maxWidth: isMobile ? '280px' : 'none', // 모바일에서 최대 너비 제한
  };

  // 버튼 공통 스타일 - 모바일에서 최적화
  const buttonStyle = {
    backgroundColor: '#D3D3D3',
    color: 'black',
    padding: isMobile ? '8px 20px' : '10px 20px',
    borderRadius: '12px',
    fontSize: isMobile ? '18px' : isTablet ? '20px' : '30px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    gap: '10px', // 아이콘과 텍스트 사이 간격 증가
    cursor: 'pointer',
    border: 'none',
    boxShadow: '0 6px 10px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease-in-out',
    width: isMobile ? '100%' : 'auto', // 모바일에서 부모 컨테이너 너비에 맞춤
  };

  // 예약 버튼 스타일 개선
  const reserveButtonStyle = {
    ...buttonStyle,
    gap: '5px',
    backgroundColor: reserveHover ? '#C0C0C0' : '#D3D3D3',
    transform: reserveHover ? 'translateY(-3px)' : 'translateY(0)',
    boxShadow: reserveHover 
      ? '0 10px 15px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.15)' 
      : '0 6px 10px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.1)',
    justifyContent: 'center', // 항상 중앙 정렬
  };

  // 반납하기 버튼 스타일
  const returnButtonStyle = {
    ...buttonStyle,
    backgroundColor: returnHover ? '#C0C0C0' : '#D3D3D3',
    transform: returnHover ? 'translateY(-3px)' : 'translateY(0)',
    boxShadow: returnHover
      ? '0 10px 15px rgba(0,0,0,0.2), 0 4px 8px rgba(0,0,0,0.15)'
      : '0 6px 10px rgba(0,0,0,0.15), 0 3px 6px rgba(0,0,0,0.1)',
    justifyContent: 'center',
  };

  // 스크롤 업 버튼 스타일 - 모바일에서 위치와 크기 최적화
  const scrollTopButtonStyle = {
    position: 'fixed',
    bottom: isMobile ? '25px' : '40px',
    right: isMobile ? '20px' : '40px',
    backgroundColor: scrollTopHover ? '#C0C0C0' : 'rgba(211, 211, 211, 0.9)',
    color: 'black',
    borderRadius: '50%',
    width: isMobile ? '45px' : '60px',
    height: isMobile ? '45px' : '60px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: isMobile ? '20px' : '24px',
    fontWeight: 'bold',
    border: 'none',
    boxShadow: scrollTopHover 
      ? '0 8px 16px rgba(0,0,0,0.25), 0 4px 8px rgba(0,0,0,0.15)' 
      : '0 4px 8px rgba(0,0,0,0.2), 0 2px 4px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    zIndex: 1000,
    transition: 'all 0.2s ease-in-out',
    transform: scrollTopHover ? 'translateY(-5px)' : 'translateY(0)',
  };


  const adminSecretButtonStyle = {
  position: 'fixed',
  bottom: isMobile ? '80px' : '110px',
  right: isMobile ? '20px' : '40px',
  backgroundColor: 'transparent',
  border: 'none',
  cursor: 'pointer',
  width: isMobile ? '45px' : '60px',
  height: isMobile ? '45px' : '60px',
  zIndex: 1000,
 // 거의 투명하게 숨김
};

  // 모바일 아이콘 스타일 - 일관성 유지
  const mobileIconStyle = {
    width: isMobile ? '20px' : isTablet ? '25px' : '35px',
    height: isMobile ? '20px' : isTablet ? '25px' : '35px',
    filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.1))',
  };

  return (
    <div style={mainContainerStyle} className="main-header">
      <div style={innerContainerStyle} className="inner-container">
        {/* KHDC 로고 및 텍스트 */}
        <div style={logoContainerStyle} className="logo-container">
  <img 
    src="/assets/KHDC.png" 
    alt="KHDC Logo" 
    style={logoStyle} 
    className="logo-image"
    onClick={handleLogoClick} // ← 추가
  />
  <span style={logoTextStyle} className="logo-text">
    Kyung Hee Digital Contents
  </span>
</div>

        {/* 로그인/로그아웃 버튼 */}
        <div style={loginContainerStyle} className="login-container">
          {isLoggedIn && (
  <span 
    onClick={() => navigate('/mypage')}
    style={{
      marginRight: isMobile ? '-10px' : '10px',
      fontWeight: '400',
      fontSize: isMobile ? '11px' : '18px',
      cursor: 'pointer',
      textDecoration: 'underline',
    }} 
    className="user-name"
  >
    {userName}
  </span>
)}

          {isLoggedIn ? (
            <span 
              onClick={handleLogout} 
              className="logout-button"
              style={{
                fontSize: isMobile ? '11px' : '18px',
                backgroundColor: isMobile ? 'rgba(240, 240, 240, 0.8)' : 'transparent',
                padding: isMobile ? '5px 10px' : '0',
                borderRadius: isMobile ? '12px' : '0',
              }}
            >
              Log out
            </span>
          ) : (
            <span 
              onClick={handleLogin} 
              className="login-button"
              style={{
                fontSize: isMobile ? '11px' : '18px',
                backgroundColor: isMobile ? 'rgba(240, 240, 240, 0.8)' : 'transparent',
                padding: isMobile ? '5px 10px' : '0',
                borderRadius: isMobile ? '12px' : '0',
              }}
            >
              Log in
            </span>
          )}
        </div>

        {/* 배경 텍스트 - 모바일에서는 크기 조정 */}
        {(!isMobile || (isMobile && !isTablet)) && (
          <div style={backgroundTextStyle} className="background-text">
            Equipment Rental
          </div>
        )}

        {/* 메인 타이틀 */}
        <div style={mainTitle1Style} className="main-title-1">
          <h1 style={mainTitle1TextStyle} className="title-text-1">
            장비대여 
          </h1>
        </div>
        <div style={mainTitle2Style} className="main-title-2">
          <h1 style={mainTitle2TextStyle} className="title-text-2">
            디지털콘텐츠학과
          </h1>
        </div>

        {/* 부제목 */}
        <div style={subtitleStyle} className="subtitle">
          <h2 style={subtitleTextStyle} className="subtitle-text">
            {isMobile ? 'Department of Digital Contents' : (
              <>
                Department of Digital <br /> Contents
              </>
            )}
          </h2>
        </div>

        {/* 구분선 */}
        <hr style={dividerStyle} className="divider" />

        {/* 안내 문구 */}
        <div style={noticeStyle} className="notice">
          <p style={noticeTextStyle} className="notice-text">
            "프로젝터", "타블렛" 분류의 장비는 대여신청을 받지 않습니다.<br />
            학과 사무실 방문을 통해 대여가 가능합니다.
          </p>
        </div>

        {/* 버튼 그룹 */}
        <div style={buttonGroupStyle} className="button-group">
          {/* 예약하기 버튼 */}
          <button 
            onClick={handleReservation}
            onMouseEnter={() => setReserveHover(true)}
            onMouseLeave={() => setReserveHover(false)}
            style={reserveButtonStyle}
            className="reserve-button"
          >
            <img 
              src="/assets/CheckMark.png" 
              alt="Reserve Icon"
              style={mobileIconStyle}
              className="button-icon" 
            />
            예약하기
          </button>

          {/* 반납하기 버튼 */}
          <button
            onClick={() => navigate('/mypage', { state: { activeTab: 'current' } })}
            onMouseEnter={() => setReturnHover(true)}
            onMouseLeave={() => setReturnHover(false)}
            style={returnButtonStyle}
            className="return-button"
          >
            <img
              src="/assets/CheckMark.png"
              alt="Return Icon"
              style={mobileIconStyle}
              className="button-icon"
            />
            반납하기
          </button>
        </div>
{/* 숨겨진 관리자 버튼 */}
<button
  onClick={() => navigate('/admins')}
  style={adminSecretButtonStyle}
  aria-label=""
/>
        {/* 맨 위로 스크롤 버튼 */}
        {isVisible && (
          <button 
            onClick={scrollToTop}
            onMouseEnter={() => setScrollTopHover(true)}
            onMouseLeave={() => setScrollTopHover(false)}
            style={scrollTopButtonStyle}
            className="scroll-top-button"
            aria-label="맨 위로 스크롤"
          >
            ↑
          </button>
        )}
      </div>
    </div>
  );
}

export default MainHeader;