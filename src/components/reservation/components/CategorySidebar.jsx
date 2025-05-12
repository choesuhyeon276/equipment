import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

const CategorySidebar = ({ 
  categories, 
  selectedCategory, 
  toggleCategory, 
  isMobile 
}) => {
  // 모바일에서 카테고리 메뉴 열고 닫기 상태
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // 모바일 무신사 스타일 카테고리 메뉴
  if (isMobile) {
    return (
      <div style={{
        width: '36px',
        height: '36px',
        position: 'relative',
        zIndex: 50
      }}>
        {/* 햄버거 버튼 */}
        <div 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            width: '36px',
            height: '36px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#f5f5f5',
            borderRadius: '4px',
            cursor: 'pointer',
            border: '1px solid #e0e0e0'
          }}
        >
          <div style={{ width: '16px', height: '2px', backgroundColor: '#333' }}></div>
          <div style={{ width: '16px', height: '2px', backgroundColor: '#333' }}></div>
          <div style={{ width: '16px', height: '2px', backgroundColor: '#333' }}></div>
        </div>
        
        {/* 드롭다운 메뉴 */}
        {isMenuOpen && (
          <div style={{
            position: 'absolute',
            top: '40px',
            left: '0',
            width: '180px',
            maxHeight: '300px',
            border: '1px solid #e8e8e8',
            borderRadius: '4px',
            backgroundColor: 'white',
            overflow: 'auto',
            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
            zIndex: 1000
          }}>
            {/* 선택된 카테고리 표시 */}
            {selectedCategory !== 'All' && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 12px',
                backgroundColor: '#f0f0f0',
                borderBottom: '1px solid #e0e0e0'
              }}>
                <div style={{ 
                  fontSize: '13px', 
                  fontWeight: 'bold',
                  maxWidth: '85%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {selectedCategory}
                </div>
                <X 
                  size={14} 
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleCategory('All');
                    setIsMenuOpen(false);
                  }}
                  style={{ cursor: 'pointer' }}
                />
              </div>
            )}
            
            {/* 카테고리 목록 */}
            <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
              {categories.map((category) => (
                <div 
                  key={category.name} 
                  style={{
                    padding: '10px 12px',
                    fontSize: '13px',
                    borderBottom: '1px solid #f0f0f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: selectedCategory === category.name ? '#f8f8f8' : 'white',
                    cursor: 'pointer'
                  }}
                  onClick={() => {
                    toggleCategory(category.name);
                    setIsMenuOpen(false);
                  }}
                >
                  <div style={{
                    maxWidth: '85%',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {category.name}
                    <span style={{ 
                      fontSize: '11px', 
                      color: '#888', 
                      marginLeft: '5px' 
                    }}>({category.count})</span>
                  </div>
                  {selectedCategory === category.name && (
                    <div style={{ 
                      color: '#1a6cff',
                      fontWeight: 'bold',
                      fontSize: '11px'
                    }}>선택됨</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // 데스크탑은 원래 스타일 유지
  return (
    <div style={{
      width: '300px',
      border: '1px solid #E0E0E0',
      borderRadius: '10px',
      padding: '20px',
      height: 'fit-content',
      marginBottom: '0'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Categories</h3>
        {selectedCategory !== 'All' && (
          <div 
            style={{ 
              cursor: 'pointer', 
              color: '#888',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            onClick={() => toggleCategory('All')}
          >
            Clear
            <X size={16} />
          </div>
        )}
      </div>
      {categories.map((category) => (
        <div 
          key={category.name} 
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 0',
            cursor: 'pointer',
            backgroundColor: selectedCategory === category.name ? '#f0f0f0' : 'transparent'
          }}
          onClick={() => toggleCategory(category.name)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>{category.name}</span>
            <span style={{ 
              fontSize: '12px', 
              color: '#888', 
              marginLeft: '5px' 
            }}>({category.count})</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategorySidebar;