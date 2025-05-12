import React from 'react';
import { Search, X } from 'lucide-react';

const SearchInput = ({ searchTerm, setSearchTerm, isMobile }) => {
  // 무신사 스타일의 모바일 검색 입력
  if (isMobile) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        width: '100%',
        height: '36px',
        backgroundColor: '#f8f8f8',
        borderRadius: '4px',
        overflow: 'hidden',
        border: '1px solid #e8e8e8',
        position: 'relative',
        flex: 1
      }}>
        <Search 
          size={16} 
          style={{ 
            marginLeft: '12px',
            color: '#666'
          }} 
        />
        
        <input
          type="text"
          placeholder="이름, 브랜드, 용도 등"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            height: '100%',
            padding: '0 35px 0 10px',
            fontSize: '13px',
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent'
          }}
        />
        
        {searchTerm && (
          <div 
            onClick={() => setSearchTerm('')}
            style={{
              position: 'absolute',
              right: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#ddd',
              cursor: 'pointer'
            }}
          >
            <X size={12} color="#666" />
          </div>
        )}
      </div>
    );
  }

  // 데스크탑은 기존 스타일 유지
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      width: '30%',
      height: '35px',
      borderBottom: '2px solid #000000',
      borderRadius: '0px',
      overflow: 'hidden',
      marginBottom: '20px'
    }}>
      <input
        type="text"
        placeholder="이름, 브랜드, 용도 등"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          fontSize: '18px', 
          lineHeight: '5px',
          border: 'none',
          outline: 'none'
        }}
      />
    </div>
  );
};

export default SearchInput;