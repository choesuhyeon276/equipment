import React from 'react';

// CartNavItem 컴포넌트 - 메뉴용 (모바일)
const CartNavItem = ({ children, active, onClick }) => (
  <div 
    onClick={onClick}
    style={{
      padding: '5px 0', 
      width: '25%',
      fontSize: '12px',
      fontWeight: active ? '700' : '400',
      color: active ? '#fff' : '#aaa',
      borderBottom: active ? '2px solid #fff' : 'none',
      cursor: 'pointer',
      position: 'relative',
      textAlign: 'center'
    }}
  >
    {children}
  </div>
);

export default CartNavItem;