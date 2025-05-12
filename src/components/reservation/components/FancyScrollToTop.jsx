// src/components/reservation/components/FancyScrollToTop.jsx
import React, { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

const FancyScrollToTop = ({ isMobile }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // 맨 위로 스크롤 함수 - 브라우저 호환성 고려
  const scrollToTop = () => {
    console.log("스크롤 맨 위로 함수 실행");
    
    // 실제로 스크롤 해결에 가장 효과적인 방법: history API 사용
    try {
      // 현재 URL 저장
      const currentURL = window.location.href;
      
      // 임시 해시 추가하고 리셋
      window.location.href = "#top";
      setTimeout(() => {
        history.replaceState(null, document.title, currentURL);
      }, 10);
    } catch (e) {
      console.error("history API 오류:", e);
    }
    
    // 기본 스크롤 메서드들도 사용
    try {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      
      // 가능한 스크롤 컨테이너들 탐색
      const containers = [
        document.querySelector('.mobile-container'),
        document.querySelector('.desktop-container'),
        document.querySelector('main'),
        document.querySelector('#root'),
        document.querySelector('body > div')
      ];
      
      containers.forEach(container => {
        if (container) container.scrollTop = 0;
      });
    } catch (e) {
      console.error("DOM 스크롤 오류:", e);
    }
    
    console.log("모든 스크롤 메서드 실행 완료");
  };
  
  // 모바일이 아니면 렌더링하지 않음
  if (!isMobile) return null;
  
  return (
    <>
      <button
        onClick={scrollToTop}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={() => setIsHovered(true)}
        onTouchEnd={() => setIsHovered(false)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '45px',
          height: '45px',
          borderRadius: '50%',
          backgroundColor: isHovered ? '#000' : 'rgba(0, 0, 0, 0.75)',
          border: 'none',
          outline: 'none',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          cursor: 'pointer',
          zIndex: 9999,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          transition: 'all 0.3s ease',
          transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
          touchAction: 'manipulation',
          WebkitAppearance: 'none'
        }}
      >
        <ChevronUp 
          size={24} 
          color="#fff" 
        />
      </button>
    </>
  );
};

export default FancyScrollToTop;