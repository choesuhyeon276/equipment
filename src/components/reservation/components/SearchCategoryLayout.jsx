import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import CategorySidebar from './CategorySidebar';
import SearchInput from './SearchInput';

const SearchCategoryLayout = ({ 
  isMobile, 
  categories, 
  selectedCategory, 
  toggleCategory, 
  searchTerm, 
  setSearchTerm,
  availableOnly,
  setAvailableOnly
}) => {
  if (isMobile) {
    // 모바일 레이아웃: 검색창과 카테고리 아이콘 나란히 배치
    return (
      <div style={{
        marginBottom: '15px',
        width: '100%'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          width: '100%'
        }}>
          {/* 햄버거 아이콘 카테고리 메뉴 */}
          <div style={{ 
            flexShrink: 0, // 고정 크기 유지 
            width: '36px',
            height: '36px'
          }}>
            <CategorySidebar 
              categories={categories}
              selectedCategory={selectedCategory}
              toggleCategory={toggleCategory}
              isMobile={true}
            />
          </div>
          
          {/* 검색창 */}
          <div style={{ 
            flex: 1,
            width: 'calc(100% - 96px)' // 아이콘 너비 + 간격 + 대여가능 버튼 너비
          }}>
            <SearchInput 
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              isMobile={true}
            />
          </div>
          
          {/* 대여 가능 버튼 */}
          <div 
            style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              cursor: 'pointer',
              padding: '0 8px',
              height: '36px',
              borderRadius: '18px',
              backgroundColor: availableOnly ? '#f0f0f0' : 'white',
              border: '1px solid #e8e8e8',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
            onClick={() => setAvailableOnly(!availableOnly)}
          >
            <CheckCircle2 size={14} color={availableOnly ? '#1a6cff' : '#aaaaaa'} />
            <span>대여가능</span>
          </div>
        </div>
      </div>
    );
  }
  
  // 데스크탑 레이아웃: 기존 배치 유지
  return (
    <SearchInput 
      searchTerm={searchTerm}
      setSearchTerm={setSearchTerm}
      isMobile={false}
    />
  );
};

export default SearchCategoryLayout;