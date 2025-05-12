// src/components/reservation/components/InfiniteScroll.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronUp } from 'lucide-react';

const InfiniteScroll = ({ 
  children, 
  filteredItems, 
  setDisplayedItems,
  itemsPerPage = 12, 
  isMobile 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [page, setPage] = useState(1);
  const loadMoreRef = useRef(null);
  const prevFilteredItemsRef = useRef([]);
  
  // filteredItems가 변경됐는지 확인
  useEffect(() => {
    // 필터링된 아이템 배열이 변경되면 페이지를 리셋하고 처음 페이지만 표시
    if (
      JSON.stringify(prevFilteredItemsRef.current) !== 
      JSON.stringify(filteredItems)
    ) {
      setPage(1);
      if (filteredItems && filteredItems.length > 0) {
        setDisplayedItems(filteredItems.slice(0, itemsPerPage));
      }
      prevFilteredItemsRef.current = filteredItems;
    }
  }, [filteredItems, itemsPerPage, setDisplayedItems]);
  
  // 스크롤 이벤트 감지하여 맨 위로 버튼 표시 여부 결정
  useEffect(() => {
    if (!isMobile) return;
    
    const handleScroll = () => {
      setIsVisible(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isMobile]);
  
  // 로드 더 보기 함수 - 메모이제이션으로 불필요한 재생성 방지
  const loadMoreItems = useCallback(() => {
    if (!filteredItems || page * itemsPerPage >= filteredItems.length) return;
    
    const nextPage = page + 1;
    const newItems = filteredItems.slice(0, nextPage * itemsPerPage);
    
    setDisplayedItems(newItems);
    setPage(nextPage);
  }, [filteredItems, page, itemsPerPage, setDisplayedItems]);
  
  // 무한 스크롤 구현 - 의존성 배열 최적화
  useEffect(() => {
    if (!isMobile || !loadMoreRef.current) return;
    
    const observer = new IntersectionObserver(entries => {
      const [entry] = entries;
      if (entry.isIntersecting) {
        loadMoreItems();
      }
    }, { threshold: 0.1 });
    
    observer.observe(loadMoreRef.current);
    
    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
      observer.disconnect();
    };
  }, [isMobile, loadMoreItems]);
  
  // 맨 위로 스크롤
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  // 모바일에서만 무한 스크롤 적용
  if (isMobile) {
    return (
      <>
        {children}
        
        {/* 로드 더 보기 트리거 포인트 */}
        <div 
          ref={loadMoreRef} 
          style={{ 
            height: '20px', 
            margin: '10px 0',
            visibility: filteredItems && page * itemsPerPage < filteredItems.length ? 'visible' : 'hidden'
          }}
        />
        
        {/* 맨 위로 버튼 */}
        {isVisible && (
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
      </>
    );
  }
  
  // PC는 기존 방식 유지
  return children;
};

export default InfiniteScroll;