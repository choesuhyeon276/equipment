// src/pages/MyPage/components/MissingInfoNotice.jsx
import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import { formatPhoneNumber } from '../utils/formatters';

const MissingInfoNotice = ({ 
  userProfile, 
  studentId, 
  setStudentId, 
  phoneNumber, 
  setPhoneNumber, 
  agreementFile, 
  setAgreementFile, 
  isUploading, 
  agreementSubmitted,
  uploadAgreement,
  updateProfileData,
  isMobile
}) => {
  // 필수 정보 중 하나라도 없으면 알림 표시
  const missingFields = !userProfile?.phoneNumber || !userProfile?.studentId || !userProfile?.agreementURL;
  const [showNotice, setShowNotice] = useState(true);
  
  if (!missingFields || !showNotice) return null;
  
  return (
    <div style={{
      position: 'fixed',
      top: isMobile ? '80px' : '16px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: isMobile ? 'calc(100% - 40px)' : 'auto',
      minWidth: isMobile ? 'auto' : '500px', 
      maxWidth: isMobile ? 'auto' : '700px',
      zIndex: 1000,
      backgroundColor: '#fff8e1',
      border: '1px solid #ffecb3',
      padding: isMobile ? '16px' : '24px',
      borderRadius: '8px',
      boxShadow: '0 4px 10px rgba(0, 0, 0, 0.15)',
      color: '#5d4037',
      animation: 'fadeInDown 0.5s ease forwards',
      whiteSpace: isMobile ? 'normal' : 'nowrap'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '10px',
        whiteSpace: isMobile ? 'normal' : 'nowrap'
      }}>
        <h3 style={{
          fontSize: isMobile ? '16px' : '18px',
          fontWeight: 'bold',
          marginTop: 0,
          marginBottom: '0',
          whiteSpace: isMobile ? 'normal' : 'nowrap',
          color: '#e65100'
        }}>
          <AlertTriangle size={isMobile ? 16 : 18} style={{ marginRight: '5px' }} />
          대여 전 필수 정보 입력 안내
        </h3>
        <button
          onClick={() => setShowNotice(false)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '5px',
            marginLeft: '15px',
            marginTop: '-5px'
          }}
        >
          <X size={16} color="#666" />
        </button>
      </div>
      
      <p style={{
        fontSize: isMobile ? '14px' : '15px',
        lineHeight: '1.5',
        marginBottom: '16px',
        whiteSpace: isMobile ? 'normal' : 'nowrap'
      }}>
        장비 예약을 위해 아래 정보를 먼저 입력해주세요:
      </p>
      
      <ul style={{
        paddingLeft: isMobile ? '10px' : '20px',
        marginBottom: '16px',
        listStyleType: 'none'
      }}>
        {/* 학번 입력 필드 */}
        {!userProfile?.studentId && (
          <li style={{
            marginBottom: '10px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            fontSize: isMobile ? '14px' : '15px',
            lineHeight: '1.4',
            whiteSpace: isMobile ? 'normal' : 'nowrap'
          }}>
            <div style={{ 
              marginRight: '8px', 
              marginBottom: isMobile ? '5px' : '0',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '5px' }}>🎓</span>
              학번이 입력되지 않았습니다.
            </div>
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="ex) 2024104520"
              style={{
                marginLeft: isMobile ? '0' : '36px',
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                width: isMobile ? '100%' : '200px'
              }}
            />
          </li>
        )}

        {/* 전화번호 입력 필드 */}
        {!userProfile?.phoneNumber && (
          <li style={{
            marginBottom: '10px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: isMobile ? 'flex-start' : 'center',
            fontSize: isMobile ? '14px' : '15px',
            lineHeight: '1.4',
            whiteSpace: isMobile ? 'normal' : 'nowrap'
          }}>
            <div style={{ 
              marginRight: '8px', 
              marginBottom: isMobile ? '5px' : '0',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '5px' }}>📱</span>
              전화번호가 입력되지 않았습니다.
            </div>
            <input
              type="text"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
              placeholder="010-0000-0000"
              maxLength={13}
              style={{
                marginLeft: isMobile ? '0' : '10px',
                padding: '4px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontSize: '14px',
                width: isMobile ? '100%' : '200px'
              }}
            />
          </li>
        )}

        {/* 서약서 업로드 필드 */}
        {!userProfile?.agreementURL && (
          <li style={{
            marginBottom: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            fontSize: isMobile ? '14px' : '15px',
            lineHeight: '1.4'
          }}>
            <div style={{ 
              marginBottom: '8px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '5px' }}>📝</span> 
              서약서가 업로드되지 않았습니다.
            </div>
            
            <div style={{
              display: 'flex',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              gap: '8px',
              width: '100%'
            }}>
              <a 
                href="https://firebasestorage.googleapis.com/v0/b/equipment-rental-system-838f0.firebasestorage.app/o/forms%2F2025%20%EB%94%94%EC%A7%80%ED%84%B8%EC%BD%98%ED%85%90%EC%B8%A0%ED%95%99%EA%B3%BC%20%EC%9E%A5%EB%B9%84%EB%8C%80%EC%97%AC%20%EC%84%9C%EC%95%BD%EC%84%9C.pdf?alt=media&token=8f4a614f-c628-4157-b18d-45fb95773542"
                target="_blank"
                rel="noopener noreferrer"
                download="장비대여_서약서_2025.pdf"
                style={{
                  display: 'inline-block',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  textDecoration: 'none',
                  fontSize: '13px',
                  transition: 'background-color 0.3s ease',
                  flex: isMobile ? '1 1 100%' : 'initial'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#1565c0';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#1976d2';
                }}
              >
                서약서 양식 다운로드
              </a>

              <button
                onClick={() => document.getElementById('agreementFileInput').click()}
                style={{
                  backgroundColor: '#1976d2',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '13px',
                  marginLeft: isMobile ? "0" : "14px",
                  whiteSpace: 'nowrap',
                  flex: isMobile ? '1 1 48%' : 'initial'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#1565c0';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#1976d2';
                }}
              >
                업로드
              </button>

              <input 
                id="agreementFileInput"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.heic"
                onChange={(e) => setAgreementFile(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </div>
            
            {agreementFile && (
              <div style={{ 
                marginTop: '8px',
                fontSize: '13px',
                color: '#555'
              }}>
                선택된 파일: {agreementFile.name}
              </div>
            )}
          </li>
        )}
      </ul>

      <button
        onClick={() => {
          if (agreementFile && !isUploading) {
            uploadAgreement(); // 파일이 있으면 서약서 업로드
          } else {
            updateProfileData(); // 파일이 없으면 정보 저장
          }
        }}
        disabled={isUploading} // 업로드 중에는 비활성화
        style={{
          width: '100%',
          padding: '8px',
          backgroundColor: agreementFile && !isUploading ? '#4caf50' : '#0772ed', 
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: isUploading ? 'not-allowed' : 'pointer',
          fontSize: '15px',
          transition: 'background-color 0.3s ease',
          whiteSpace: 'nowrap'
        }}
      >
        {isUploading
          ? '업로드 중...'
          : agreementFile
            ? (agreementSubmitted ? '서약서 다시 등록하기' : '서약서 등록하기')
            : '정보 저장하기'}
      </button>
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes fadeInDown {
            from {
              opacity: 0;
              transform: translate(-50%, -20px);
            }
            to {
              opacity: 1;
              transform: translate(-50%, 0);
            }
          }
        `
      }} />
    </div>
  );
};

export default MissingInfoNotice;