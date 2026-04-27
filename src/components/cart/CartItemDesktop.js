import React from 'react';
import { Trash2 } from 'lucide-react';
import { formatKoreanDateTime } from '../../pages/MyPage/utils/formatters';

// 장바구니 아이템 컴포넌트 (데스크탑)
const CartItemDesktop = ({ item, onRemove }) => {
  return (
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #E0E0E0',
        paddingBottom: '15px',
        marginBottom: '15px'
      }}
    >
      {/* 아이템 이미지 */}
      <div style={{ 
        width: '150px', 
        height: '150px', 
        marginRight: '20px',
        backgroundColor: '#F5F5F5',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {item.imageURL ? (
          <img 
            src={item.imageURL} 
            alt={item.name} 
            style={{ 
              width: '100%', 
              height: '100%', 
              objectFit: 'cover' 
            }} 
          />
        ) : (
          item.name
        )}
      </div>

      {/* 아이템 상세 정보 */}
      <div style={{ flex: 1 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center' 
        }}>
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold' 
          }}>
            {item.name}
          </h3>
          <button
            aria-label={`${item.name} 삭제`}
            onClick={() => onRemove(item.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#888',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <Trash2 size={20} />
          </button>
        </div>
        <p style={{ color: '#666', marginTop: '5px' }}>
          {item.category} | {item.condition}
{item.condition === "주의" && (
  <>
    <br />
    ⚠️ <span style={{ fontWeight: 'bold', color:'black' }}>{item.issues}</span>
  </>
)}


        </p>

        {/* 대여 상세 정보 */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'flex-start', 
          marginTop: '15px' 
        }}>
          <div style={{ marginBottom: '4px' }}>
            <span style={{ fontWeight: 'bold', marginRight: '10px' }}>대여 시작:</span>
            {formatKoreanDateTime(`${item.rentalDate}T${item.rentalTime}`)}
          </div>
          <div>
            <span style={{ fontWeight: 'bold', marginRight: '10px' }}>반납 예정:</span>
            {formatKoreanDateTime(`${item.returnDate}T${item.returnTime}`)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItemDesktop;