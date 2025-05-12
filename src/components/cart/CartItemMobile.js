import React from 'react';
import { Trash2 } from 'lucide-react';

// 장바구니 아이템 컴포넌트 (모바일)
const CartItemMobile = ({ item, onRemove }) => {
  return (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderBottom: '1px solid #ddd',
        paddingBottom: '16px',
        marginBottom: '16px'
      }}
    >
      <div style={{ display: 'flex' }}>
        {/* 아이템 이미지 */}
        <div style={{ 
          width: '100px', 
          height: '100px', 
          marginRight: '12px',
          backgroundColor: '#F5F5F5',
          borderRadius: '4px',
          overflow: 'hidden'
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
            <div style={{ 
              width: '100%', 
              height: '100%', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '8px',
              textAlign: 'center',
              fontSize: '12px'
            }}>
              {item.name}
            </div>
          )}
        </div>

        {/* 아이템 상세 정보 */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'flex-start' 
          }}>
            <h3 style={{ 
              fontSize: '14px', 
              fontWeight: 'bold',
              margin: '0 0 4px 0'
            }}>
              {item.name}
            </h3>
            <div 
              style={{ 
                cursor: 'pointer',
                color: '#888',
                padding: '4px'
              }}
              onClick={() => onRemove(item.id)}
            >
              <Trash2 size={16} />
            </div>
          </div>
          <p style={{ 
            color: '#666', 
            margin: '0 0 8px 0',
            fontSize: '12px'
          }}>
           {item.category} | {item.condition}
{item.condition === "주의" && (
  <>
    <br />
    ⚠️ <span style={{ fontWeight: 'bold', color:'black' }}>{item.issues}</span>
  </>
)}
          </p>
        </div>
      </div>

      {/* 대여 상세 정보 */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'flex-start', 
        marginTop: '12px',
        backgroundColor: '#f9f9f9',
        padding: '8px',
        borderRadius: '4px',
        fontSize: '12px'
      }}>
        <div style={{ marginBottom: '4px' }}>
          <span style={{ fontWeight: 'bold', marginRight: '8px' }}>대여:</span>
          {item.rentalDate} {item.rentalTime}
        </div>
        <div>
          <span style={{ fontWeight: 'bold', marginRight: '8px' }}>반납:</span>
          {item.returnDate} {item.returnTime}
        </div>
      </div>
    </div>
  );
};

export default CartItemMobile;