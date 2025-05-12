import React from 'react';
import { CheckCircle } from 'lucide-react';

// 예약 요약 컴포넌트 (모바일)
const ReservationSummaryMobile = ({ cartItems, userProfile, isSubmitting, onSubmit }) => {
  return (
    <div style={{ 
      width: '100%',
      backgroundColor: '#fff',
      padding: '16px',
      borderTop: '1px solid #ddd',
      position: 'sticky',
      bottom: '-10px',
      boxShadow: '0 -4px 6px rgba(0, 0, 0, 0.05)'
    }}>
      {/* 간단한 예약 요약 정보 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginBottom: '12px',
        fontSize: '14px'
      }}>
        <span style={{ fontWeight: 'bold' }}>총 예약 장비</span>
        <span>{cartItems.length}개</span>
      </div>

      {/* 예약 버튼 */}
      <button 
        onClick={onSubmit}
        disabled={isSubmitting}
        style={{
          width: '100%',
          padding: '12px',
          backgroundColor: isSubmitting ? '#666' : 'black',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          fontSize: '16px',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px'
        }}
      >
        <CheckCircle size={16} />
        {isSubmitting ? '처리 중...' : '예약하기'}
      </button>
      
      {/* 예약자 정보 간략 표시 */}
      {userProfile && (
        <div style={{
          marginTop: '12px',
          padding: '8px 0',
          borderTop: '1px solid #eee',
          fontSize: '12px',
          color: '#666'
        }}>
          예약자: {userProfile.name} <br /> 연락처: {userProfile.phoneNumber}
        </div>
      )}
    </div>
  );
};

export default ReservationSummaryMobile;