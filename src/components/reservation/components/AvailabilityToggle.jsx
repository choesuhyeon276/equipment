// src/components/reservation/components/AvailabilityToggle.jsx
import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const AvailabilityToggle = ({ availableOnly, setAvailableOnly }) => {
  const styles = {
    container: {
      display: 'flex', 
      alignItems: 'center', 
      gap: '5px', 
      cursor: 'pointer',
      padding: '5px 12px',
      borderRadius: '20px',
      backgroundColor: availableOnly ? '#f0f0f0' : 'white',
      border: '1px solid #ccc',
      transition: 'all 0.2s ease',
      userSelect: 'none'
    },
    icon: {
      transition: 'color 0.2s ease'
    }
  };

  return (
    <div 
      style={styles.container}
      onClick={() => setAvailableOnly(!availableOnly)}
    >
      <CheckCircle2 
        size={20} 
        color={availableOnly ? 'green' : 'gray'} 
        style={styles.icon}
      />
      <span>대여 가능</span>
    </div>
  );
};

export default AvailabilityToggle;