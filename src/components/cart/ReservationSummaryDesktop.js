import React from 'react';
import { CheckCircle } from 'lucide-react';

// 예약 요약 컴포넌트 (데스크탑)
const ReservationSummaryDesktop = ({ cartItems, userProfile, isSubmitting, onSubmit }) => {
  // 각 장바구니 아이템의 대여 상세정보 렌더링
  const renderRentalDetails = (item) => {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'flex-start', 
        marginTop: '15px' 
      }}>
        <div style={{ marginBottom: '5px' }}>
          <span style={{ fontWeight: 'bold', marginRight: '10px' }}>대여 시작:</span>
          {item.rentalDate} {item.rentalTime}
        </div>
        <div>
          <span style={{ fontWeight: 'bold', marginRight: '10px' }}>반납 예정:</span>
          {item.returnDate} {item.returnTime}
        </div>
      </div>
    );
  };

  return (
    <div style={{ 
      flex: 1, 
      border: '1px solid #E0E0E0', 
      borderRadius: '10px',
      padding: '20px',
      marginRight: '100px',
      height: 'fit-content'
    }}>
      <h3 style={{ 
        fontSize: '20px', 
        fontWeight: 'bold', 
        marginBottom: '20px' 
      }}>
        예약 요약
      </h3>

      {/* 사용자 정보 표시 */}
      {userProfile && (
        <div style={{
          marginBottom: '20px',
          padding: '15px',
          backgroundColor: '#f9f9f9',
          borderRadius: '8px'
        }}>
          <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>예약자 정보</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>이름:</span>
            <span>{userProfile.name || '미입력'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>연락처:</span>
            <span>{userProfile.phoneNumber || '미입력'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>학번:</span>
            <span>{userProfile.studentId || '미입력'}</span>
          </div>
        </div>
      )}

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginRight: '0px',
        marginBottom: '20px',
        fontWeight: 'bold',
        fontSize: '18px'
      }}>
        <span>총 예약 장비 수</span>
        <span>{cartItems.length}개</span>
      </div>

      <button 
        onClick={onSubmit}
        disabled={isSubmitting}
        style={{
          width: '100%',
          padding: '15px',
          backgroundColor: isSubmitting ? '#666' : 'black',
          color: 'white',
          border: 'none',
          borderRadius: '10px',
          fontSize: '18px',
          cursor: isSubmitting ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}
      >
        <CheckCircle size={20} />
        {isSubmitting ? '처리 중...' : '예약하기'}
      </button>
    </div>
  );
};

export default ReservationSummaryDesktop;