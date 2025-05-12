// 방법 1: 기존 페이지네이션 컴포넌트를 수정하여 무한 스크롤로 활용
// src/components/reservation/components/Pagination.jsx 수정

import React, { useEffect, useRef, useState } from 'react';
import { ChevronUp } from 'lucide-react';

const Pagination = ({ currentPage, totalPages, setCurrentPage, isMobile }) => {
  const [showScrollTop, setShowScrollTop] = useState(false);
  const bottomRef = useRef(null);
  
  // 모바일에서는 스크롤 감지하여 페이지 증가
  useEffect(() => {
    if (!isMobile || !bottomRef.current) return;
    
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && currentPage < totalPages) {
        setCurrentPage(prev => prev + 1);
      }
    }, { threshold: 0.5 });
    
    observer.observe(bottomRef.current);
    return () => observer.disconnect();
  }, [currentPage, totalPages, isMobile, setCurrentPage]);
  
  // 스크롤 이벤트 감지
  useEffect(() => {
    if (!isMobile) return;
    
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);
  
  // 맨 위로 스크롤
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // 무신사 스타일 모바일 페이지네이션 (무한 스크롤로 변경)
  if (isMobile) {
    return (
      <div style={{
        marginTop: '25px',
        marginBottom: '40px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '5px',
        width: '100%'
      }}>
        {/* 더 로드하기 위한 감지 지점 */}
        <div 
          ref={bottomRef} 
          style={{ 
            height: '20px', 
            textAlign: 'center',
            color: '#888',
            fontSize: '14px'
          }}
        >
          {currentPage < totalPages ? '스크롤하여 더 보기...' : '더 이상 표시할 항목이 없습니다'}
        </div>
        
        {/* 맨 위로 버튼 */}
        {showScrollTop && (
          <div 
            onClick={scrollToTop} 
            style={{
              position: 'fixed',
              bottom: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              zIndex: 100,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}
          >
            <ChevronUp size={24} color="#fff" />
          </div>
        )}
      </div>
    );
  }

  // 데스크탑 버전은 기존 레이아웃 유지 (기존 코드 그대로)
  return (
    <div style={{
      marginTop: '20px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '10px',
      flexWrap: 'wrap'
    }}>
      {/* 처음 페이지로 */}
      <button 
        onClick={() => setCurrentPage(1)}
        style={{
          padding: '5px 10px',
          border: '1px solid #ccc',
          backgroundColor: 'white',
          cursor: 'pointer',
          borderRadius: '4px'
        }}
      >
        {'<<'}
      </button>

      {/* 이전 페이지로 */}
      <button 
        onClick={() => setCurrentPage(page => Math.max(1, page - 1))}
        disabled={currentPage === 1}
        style={{
          padding: '5px 10px',
          border: '1px solid #ccc',
          backgroundColor: currentPage === 1 ? '#f0f0f0' : 'white',
          cursor: currentPage === 1 ? 'default' : 'pointer',
          borderRadius: '4px'
        }}
      >
        {'<'}
      </button>

      {/* 동적 페이지 번호 */}
      {[...Array(3)].map((_, index) => {
        let startPage = Math.max(1, currentPage - 1);
        let endPage = Math.min(totalPages, startPage + 2);
        if (endPage - startPage < 2) {
          startPage = Math.max(1, endPage - 2);
        }
        const page = startPage + index;
        if (page > totalPages) return null;

        return (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            style={{
              padding: '5px 10px',
              border: '1px solid #ccc',
              backgroundColor: currentPage === page ? 'black' : 'white',
              color: currentPage === page ? 'white' : 'black',
              cursor: 'pointer',
              borderRadius: '4px'
            }}
          >
            {page}
          </button>
        );
      })}

      {/* 다음 페이지로 */}
      <button 
        onClick={() => setCurrentPage(page => Math.min(totalPages, page + 1))}
        disabled={currentPage === totalPages}
        style={{
          padding: '5px 10px',
          border: '1px solid #ccc',
          backgroundColor: currentPage === totalPages ? '#f0f0f0' : 'white',
          cursor: currentPage === totalPages ? 'default' : 'pointer',
          borderRadius: '4px'
        }}
      >
        {'>'}
      </button>

      {/* 마지막 페이지로 */}
      <button 
        onClick={() => setCurrentPage(totalPages)}
        style={{
          padding: '5px 10px',
          border: '1px solid #ccc',
          backgroundColor: 'white',
          cursor: 'pointer',
          borderRadius: '4px'
        }}
      >
        {'>>'}
      </button>
    </div>
  );
};

export default Pagination;