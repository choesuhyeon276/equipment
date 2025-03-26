import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, User, ShoppingCart } from 'lucide-react';

const ReservationCompletePage = () => {
  const navigate = useNavigate();

  const navigateToMyPage = () => {
    navigate('/mypage');
  };

  const navigateToHome = () => {
    navigate('/');
  };

  return (
    <div style={{
      position: 'relative',
      width: '1440px',
      height: '1700px',
      background: '#FFFFFF',
      margin: '0 auto',
      fontFamily: 'Pretendard, sans-serif',
      color: '#000000'
    }}>
      {/* Header - Same as Cart Page */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        right: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '0px solid #5F5F5F',
        paddingBottom: '45px'
      }}>
        <div style={{ 
          display: 'flex',
          position: 'absolute',
          gap: '20px',
          fontSize: '18px',
          fontWeight: '400',
          right: "16px",
          top: '45px'
        }}>
          <span>Home</span>
          <span>Calendar</span>
          <span>Reservation</span>
          <span>Note</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            position: 'absolute',
            fontSize: '36px', 
            fontWeight: 'bold', 
            letterSpacing: '0px',
            top: '0px',
            left: '70px'
          }}>DIRT</div>
          <div style={{ 
            fontSize: '12px', 
            color: '#000000',
            position: 'absolute',
            left: '110px',
            top: '40px',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap',
            fontWeight: '100'
          }}>Digital content rental service</div>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <div style={{ 
            display: 'flex',
            position: 'absolute',
            right: '110px',
            top: '0px',
            alignItems: 'center', 
            gap: '5px', 
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: '20px',
            backgroundColor: '#f0f0f0'
          }}>
            <User size={20} />
            <span>My page</span>
          </div>
          <div style={{ 
            position: 'absolute',
            right: '13px',
            display: 'flex', 
            top: '0px',
            alignItems: 'center', 
            gap: '5px', 
            cursor: 'pointer',
            padding: '5px 10px',
            borderRadius: '20px',
            backgroundColor: '#f0f0f0'
          }}>
            <ShoppingCart size={20} />
            <span>Cart</span>
          </div>
        </div>
      </div>

      {/* Reservation Completion Content */}
      <div style={{
        position: 'absolute',
        top: '25%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        width: '100%',
        padding: '0 50px'
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <CheckCircle 
            size={100} 
            color='black' 
            style={{ 
              marginBottom: '30px',
              backgroundColor: '#f0f0f0',
              borderRadius: '50%',
              padding: '20px'
            }} 
          />
          <h1 style={{ 
            fontSize: '32px', 
            fontWeight: 'bold',
            marginBottom: '20px'
          }}>
            장비 예약이 완료되었습니다.
          </h1>
          <p style={{ 
            fontSize: '18px', 
            color: '#666',
            marginBottom: '40px',
            lineHeight: '1.6'
          }}>
            요청하신 장비 예약이 성공적으로 처리되었습니다.<br />
            자세한 내용은 마이페이지에서 확인하실 수 있습니다.
          </p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <button 
              onClick={navigateToMyPage}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: 'black',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer'
              }}>
              마이페이지로 이동
            </button>
            <button 
              onClick={navigateToHome}
              style={{
                padding: '15px 30px',
                fontSize: '18px',
                backgroundColor: '#f0f0f0',
                color: 'black',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer'
              }}>
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReservationCompletePage;