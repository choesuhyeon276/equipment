import React, { useState, useEffect } from 'react';
import { MdScreenRotation } from 'react-icons/md'; // react-icons 패키지 필요 (npm install react-icons)

const OrientationPrompt = () => {
  const [isPortrait, setIsPortrait] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    // 모바일 기기인지 확인하는 함수
    const checkIfMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || window.opera;
      return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    };
    
    // 화면 방향 확인 함수
    const checkOrientation = () => {
      if (window.matchMedia("(max-width: 920px)").matches || 
          window.innerHeight > window.innerWidth) {
        setIsPortrait(true);
      } else {
        setIsPortrait(false);
      }
    };
    
    setIsMobile(checkIfMobile());
    checkOrientation();
    
    // 화면 크기 변경 감지
    window.addEventListener('resize', checkOrientation);
    
    // 방향 변경 이벤트 - iOS/Android 지원
    if (typeof window.orientation !== 'undefined') {
      window.addEventListener('orientationchange', checkOrientation);
    }
    
    return () => {
      window.removeEventListener('resize', checkOrientation);
      if (typeof window.orientation !== 'undefined') {
        window.removeEventListener('orientationchange', checkOrientation);
      }
    };
  }, []);
  
  // 모바일 기기이면서 세로 모드일 때만 표시
  if (!isMobile || !isPortrait) {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      boxSizing: 'border-box',
      color: '#ffffff',
      textAlign: 'center'
    }}>
      <MdScreenRotation style={{
        fontSize: '80px',
        animation: 'rotate 1.5s infinite',
        color: '#ffffff',
        marginBottom: '20px'
      }} />
      <h2 style={{ margin: '0 0 15px 0', fontSize: '24px' }}>화면을 가로로 돌려주세요</h2>
      <p style={{ margin: '0', fontSize: '16px', maxWidth: '400px' }}>
        이 웹사이트는 가로 화면에 최적화되어 있습니다. 
        더 나은 경험을 위해 기기를 가로로 돌려주세요.
      </p>
      <style>
        {`
          @keyframes rotate {
            0% { transform: rotate(0deg); }
            50% { transform: rotate(90deg); }
            100% { transform: rotate(0deg); }
          }
        `}
      </style>
    </div>
  );
};

export default OrientationPrompt;