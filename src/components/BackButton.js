import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  if (location.pathname === '/main') return null; // 메인에서는 안 보이게

  return (
    <button
      onClick={() => navigate(-1)}
      style={{
        position: 'fixed',
        top: '10px',
        left: '250px',
        zIndex: 9999,
        backgroundColor: 'white',
        border: '0px solid #ccc',
        borderRadius: '50%',
        padding: '5px 10px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        color: '#333',
        boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
      }}
    >
      ←
    </button>
  );
};

export default BackButton;