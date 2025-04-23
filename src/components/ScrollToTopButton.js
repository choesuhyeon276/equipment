import React from 'react';

const ScrollToTopButton = () => {
  const handleScrollToTop = () => {
    // 1. 메인 div를 직접 탐색
    const container = document.querySelector("div[style*='overflow']") || document.getElementById('main-scroll-container');
    
    // 2. 없으면 fallback으로 window에 시도
    if (container) {
      container.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <button
      onClick={handleScrollToTop}
      style={{
        position: 'fixed',
        bottom: '50px',
        right: '150px',
        zIndex: 9999,
        backgroundColor: '#333',
        color: 'white',
        border: 'none',
        borderRadius: '50%',
        width: '50px',
        height: '50px',
        fontSize: '20px',
        cursor: 'pointer',
        boxShadow: '0px 2px 10px rgba(0,0,0,0.2)'
      }}
    >
      ↑
    </button>
  );
};

export default ScrollToTopButton;
