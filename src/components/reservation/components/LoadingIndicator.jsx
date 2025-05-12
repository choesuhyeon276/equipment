// src/components/reservation/components/LoadingIndicator.jsx
import React from 'react';

const LoadingIndicator = () => {
  const styles = {
    container: {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      width: '100%',
      backgroundColor: '#ffffff'
    },
    spinner: {
      border: '4px solid rgba(0, 0, 0, 0.1)',
      borderRadius: '50%',
      borderTop: '4px solid #000',
      width: '40px',
      height: '40px',
      animation: 'spin 1s linear infinite'
    },
    text: {
      marginTop: '20px',
      fontSize: '18px',
      fontWeight: '500',
      color: '#333'
    },
    spinnerAnimation: `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `
  };

  return (
    <div style={styles.container}>
      <style>{styles.spinnerAnimation}</style>
      <div style={styles.spinner}></div>
      <p style={styles.text}>데이터를 불러오는 중...</p>
    </div>
  );
};

export default LoadingIndicator;