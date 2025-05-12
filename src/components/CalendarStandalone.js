import React, { useEffect, useState } from "react";

function CalendarStandalone() {
  // 화면 크기에 따라 모바일 여부 판단
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 768 && window.innerWidth <= 1024);
  
  // 화면 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      setIsTablet(window.innerWidth > 768 && window.innerWidth <= 1024);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 구글 캘린더 초기화
  useEffect(() => {
    const calendarId = "837ac43ba185f6e8b56e97f1f7e15ecbb103bc44c111e6b8c81fe28ec713b8e9@group.calendar.google.com";
    const embedUrl = `https://calendar.google.com/calendar/embed?src=${calendarId}&ctz=Asia/Seoul&mode=MONTH&showTitle=0&showPrint=0&showCalendars=0&showTabs=0&showDate=1&showNav=1&showTz=0&color=%23444444&bgcolor=%23FFFFFF`;

    const calendarIframe = document.getElementById("google-calendar-standalone");
    if (calendarIframe) {
      calendarIframe.src = embedUrl;
    }
  }, []);

  // 메인 컨테이너 스타일
  const mainContainerStyle = {
    position: 'relative',
    width: '100%',
    minHeight: isMobile ? '500px' : '100vh',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  };

  // 내부 컨테이너 스타일
  const innerContainerStyle = {
    width: isMobile ? '100%' : '1440px',  // 모바일에서는 100%, PC에서는 고정 너비
    height: isMobile ? 'auto' : '940px',  // 모바일에서는 자동 높이, PC에서는 고정 높이
    backgroundColor: '#0F1316',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    margin: 'auto',
    overflow: 'hidden',
    padding: isMobile ? '20px 0' : '0',
  };

  // KHDC 로고 배경 스타일
  const logoBackgroundStyle = {
    position: 'absolute',
    width: isMobile ? '300%' : '110%',
    height: isMobile ? '300%' : '100%',
    scale: isMobile ? "100%" : "200%",
    left: isMobile ? '-350px' : '320px',
    bottom: isMobile ? '-540px' : 'auto',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    opacity: '0.5',
    zIndex: '2',
    overflow: 'hidden',
  };

  // 로고 이미지 스타일
  const logoImageStyle = {
    width: isMobile ? '100%' : '2000px',
    height: 'auto',
    objectFit: 'contain',
  };

  // 타이틀 영역 스타일
  const titleAreaStyle = {
    textAlign: 'center',
    width: '100%',
    maxWidth: '1440px',
    margin: '0 auto',
    zIndex: '2',
    padding: isMobile ? '0 10px' : '0',
    marginBottom: isMobile ? '10px' : '0',
  };

  // 타이틀 텍스트 스타일
  const titleTextStyle = {
    position: isMobile ? 'relative' : 'absolute',
    top: isMobile ? '0' : '10px',
    left: isMobile ? '-5px' : '710px',
    transform: isMobile ? 'none' : 'translateX(-50%)',
    fontSize: isMobile ? '24px' : '90px',
    fontWeight: '100',
    color: 'white',
    whiteSpace: 'nowrap',
    textAlign: isMobile ? 'center' : 'left',
    width: isMobile ? '100%' : 'auto',
    margin: isMobile ? '10px 0' : '0',
    padding: isMobile ? '10px 0' : '0',
  };

  // 캘린더 컨테이너 스타일
  const calendarContainerStyle = {
    marginTop: isMobile ? '0' : '30px',
    backgroundColor: 'transparent',
    borderRadius: '20px',
    padding: isMobile ? '0' : '20px',
    width: '100%',
    maxWidth: isMobile ? '100%' : '1200px',
    margin: '0 auto',
    zIndex: '3'
  };

  // 캘린더 iframe 스타일
  const calendarIframeStyle = {
    width: isMobile ? '95%' : '100%',
    height: isMobile ? '450px' : '750px',
    border: '0',
    borderRadius: '20px',
    filter: "grayscale(50%)",
    margin: isMobile ? '8px' : "-1px",
    padding: isMobile ? '0' : "1px",
    backgroundColor: "transparent",
  };

  return (
    <div style={mainContainerStyle}>
      <div style={innerContainerStyle}>
        {/* KHDC 로고 배경 */}
        <div style={logoBackgroundStyle}>
          <img
            src="/assets/KHDC2.png"
            alt="KHDC Logo"
            style={logoImageStyle}
          />
        </div>
        
        {/* 타이틀 영역 */}
        <div style={titleAreaStyle}>
          <h2 style={titleTextStyle}>Equipment Rental Status Calendar</h2>
        </div>
        
        {/* 구글 캘린더 */}
        <div style={calendarContainerStyle}>
          <iframe
            id="google-calendar-standalone"
            title="Google Calendar"
            style={calendarIframeStyle}
          ></iframe>
        </div>
      </div>
    </div>
  );
}

export default CalendarStandalone;