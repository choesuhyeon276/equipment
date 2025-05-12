// src/pages/MyPage/components/ProfileSidebar.jsx
import React, { useState } from 'react';
import { User, Edit, Save, FileText, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

const ProfileSidebar = ({
  user,
  studentId,
  setStudentId,
  phoneNumber,
  setPhoneNumber,
  penaltyPoints,
  agreementSubmitted,
  agreementURL,
  agreementFile,
  setAgreementFile,
  isUploading,
  uploadProgress,
  uploadAgreement,
  isEditing,
  setIsEditing,
  updateProfileData,
  currentRentals,
  rentalHistory,
  handleFileChange,
  isMobile
}) => {
  // 모바일에서만 사용할 섹션 접고 펼치기 상태
  const [showProfileInfo, setShowProfileInfo] = useState(false);
  const [showAgreement, setShowAgreement] = useState(false);

  // 스타일 정의
  const cardStyle = {
    border: '1px solid #E0E0E0', 
    borderRadius: '10px',
    padding: '15px',
    marginBottom: '15px',
    backgroundColor: '#fff'
  };
  
  // 토글 버튼 스타일
  const toggleButtonStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    padding: '10px 15px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
    color: '#333',
    marginBottom: '10px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  };
  
  // 모바일 버전 (간소화)
  if (isMobile) {
    return (
      <div style={{ width: '100%', marginTop: '-10px' }}>
        {/* 간소화된 통계 요약 */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-around', 
          backgroundColor: '#f9f9f9',
          padding: '12px 0',
          borderRadius: '8px',
          marginBottom: '15px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: '#666' }}>현재 대여</p>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>{currentRentals.length}개</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: '#666' }}>대여 이력</p>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>{rentalHistory.length}건</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 2px 0', fontSize: '12px', color: '#666' }}>누적 벌점</p>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px', color: penaltyPoints > 0 ? '#e53935' : '#000' }}>{penaltyPoints}점</p>
          </div>
        </div>

        {/* 프로필 토글 버튼 */}
        <button 
          onClick={() => setShowProfileInfo(prev => !prev)}
          style={toggleButtonStyle}
        >
          <span>프로필 정보 {showProfileInfo ? '접기' : '보기'}</span>
          {showProfileInfo ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* 펼쳤을 때 프로필 정보 */}
        {showProfileInfo && (
          <div style={cardStyle}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '10px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: '#f0f0f0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: '10px'
              }}>
                <User size={22} color="#555" />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', margin: '0 0 2px 0' }}>{user?.name || '사용자'}</h3>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>{user?.email || ''}</p>
              </div>
              <button 
                onClick={() => isEditing ? updateProfileData() : setIsEditing(true)}
                style={{
                  marginLeft: 'auto',
                  backgroundColor: 'transparent',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  cursor: 'pointer',
                  color: '#4285f4',
                  padding: '4px'
                }}
              >
                {isEditing ? (
                  <Save size={16} style={{ marginRight: '2px' }} />
                ) : (
                  <Edit size={16} />
                )}
              </button>
            </div>
            
            {/* 학번 */}
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', color: '#666' }}>
                학번
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="ex) 2024104520"
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                />
              ) : (
                <p style={{ fontSize: '13px', margin: '0 0 8px 0' }}>{studentId || '미입력'}</p>
              )}
            </div>
            
            {/* 전화번호 */}
            <div style={{ marginBottom: '5px' }}>
              <label style={{ display: 'block', marginBottom: '3px', fontSize: '13px', color: '#666' }}>
                전화번호
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => {
                    const formattedPhone = e.target.value.replace(/[^0-9]/g, '');
                    if (formattedPhone.length <= 3) setPhoneNumber(formattedPhone);
                    else if (formattedPhone.length <= 7) setPhoneNumber(formattedPhone.replace(/(\d{3})(\d+)/, '$1-$2'));
                    else setPhoneNumber(formattedPhone.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3').slice(0, 13));
                  }}
                  placeholder="전화번호를 입력하세요"
                  maxLength={13}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                />
              ) : (
                <p style={{ fontSize: '13px', margin: '0 0 8px 0' }}>{phoneNumber || '미입력'}</p>
              )}
            </div>
            
            {isEditing && (
              <button
                onClick={updateProfileData}
                style={{
                  width: '100%',
                  padding: '8px 0',
                  backgroundColor: '#4285f4',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  marginTop: '10px'
                }}
              >
                정보 저장
              </button>
            )}
          </div>
        )}

        {/* 서약서 토글 버튼 */}
        <button 
          onClick={() => setShowAgreement(prev => !prev)}
          style={toggleButtonStyle}
        >
          <span>대여 서약서 {showAgreement ? '접기' : '보기'}</span>
          {showAgreement ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* 펼쳤을 때 서약서 섹션 */}
        {showAgreement && (
          <div style={cardStyle}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
              <FileText size={16} style={{ marginRight: '5px' }} />
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>대여 서약서</h3>
            </div>

            {agreementSubmitted && agreementURL ? (
              <div style={{
                backgroundColor: '#e8f5e9',
                color: '#2e7d32',
                padding: '8px 10px',
                borderRadius: '4px',
                marginBottom: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '13px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircle size={14} style={{ marginRight: '5px' }} />
                  서약서가 등록되었습니다.
                </div>
                <a 
                  href={agreementURL} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ 
                    fontSize: '12px', 
                    color: '#2e7d32',
                    textDecoration: 'underline'
                  }}
                >
                  보기
                </a>
              </div>
            ) : (
              <p style={{ fontSize: '13px', margin: '0 0 8px 0', color: '#666' }}>
                장비 대여를 위해 서약서를 등록해주세요.
              </p>
            )}

            {agreementSubmitted && (
              <p style={{ fontSize: '12px', color: '#666', margin: '0 0 8px 0' }}>
                잘못 등록하셨나요?
              </p>
            )}

            <input 
              type="file" 
              onChange={handleFileChange}
              style={{ 
                marginBottom: '10px', 
                width: '100%',
                fontSize: '12px'
              }}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.bmp,.gif,.webp,.heic"
            />

            {isUploading && (
              <div style={{ marginBottom: '10px' }}>
                <div style={{ 
                  width: '100%', 
                  height: '4px', 
                  backgroundColor: '#e0e0e0',
                  borderRadius: '2px',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    height: '100%', 
                    width: `${uploadProgress}%`,
                    backgroundColor: '#4caf50',
                    transition: 'width 0.3s'
                  }} />
                </div>
                <p style={{ fontSize: '11px', color: '#666', margin: '3px 0 0 0', textAlign: 'center' }}>
                  {Math.round(uploadProgress)}% 업로드 중...
                </p>
              </div>
            )}

            <button 
              onClick={uploadAgreement}
              disabled={!agreementFile || isUploading}
              style={{
                width: '100%',
                padding: '8px 0',
                backgroundColor: agreementFile && !isUploading ? '#4caf50' : '#e0e0e0',
                color: agreementFile && !isUploading ? 'white' : '#666',
                border: 'none',
                borderRadius: '4px',
                cursor: agreementFile && !isUploading ? 'pointer' : 'not-allowed',
                fontSize: '13px'
              }}
            >
              {agreementSubmitted ? '서약서 다시 등록하기' : '서약서 등록하기'}
            </button>
          </div>
        )}
      </div>
    );
  }

  // 데스크톱 버전은 원래 디자인 유지
  return (
    <div style={{ width: '300px' }}>
      {/* 사용자 프로필 카드 */}
      <div style={{ 
        border: '1px solid #E0E0E0', 
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '20px' 
        }}>
          <div style={{ 
            width: '60px',
            height: '60px',
            borderRadius: '30px',
            backgroundColor: '#f0f0f0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: '15px'
          }}>
            <User size={30} color="#555" />
          </div>
          <div>
            <h3 style={{ fontWeight: 'bold', fontSize: '18px', color: '#000000' }}>{user?.name}</h3>
            <p style={{ color: '#666', fontSize: '14px' }}>{user?.email}</p>
          </div>
        </div>

        {/* 학번 및 전화번호 필드 */}
        <div style={{ marginBottom: '20px', borderBottom: '1px solid #e0e0e0', paddingBottom: '15px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '10px' 
          }}>
            <h4 style={{ fontSize: '16px', fontWeight: 'bold', color: '#000000' }}>프로필 정보</h4>
            <button 
              onClick={() => isEditing ? updateProfileData() : setIsEditing(true)}
              style={{
                backgroundColor: 'transparent',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                cursor: 'pointer',
                color: '#4285f4',
                padding: '5px'
              }}
            >
              {isEditing ? (
                <>
                  <Save size={16} style={{ marginRight: '4px' }} />
                  저장
                </>
              ) : (
                <>
                  <Edit size={16} style={{ marginRight: '4px' }} />
                  수정
                </>
              )}
            </button>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>
              학번
            </label>
            {isEditing ? (
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="ex)2024104520"
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            ) : (
              <p style={{ fontSize: '14px', color: '#000000' }}>{studentId || '미입력'}</p>
            )}
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', color: '#666' }}>
              전화번호
            </label>
            {isEditing ? (
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => {
                  const formattedPhone = e.target.value.replace(/[^0-9]/g, '');
                  if (formattedPhone.length <= 3) setPhoneNumber(formattedPhone);
                  else if (formattedPhone.length <= 7) setPhoneNumber(formattedPhone.replace(/(\d{3})(\d+)/, '$1-$2'));
                  else setPhoneNumber(formattedPhone.replace(/(\d{3})(\d{4})(\d+)/, '$1-$2-$3').slice(0, 13));
                }}
                placeholder="전화번호를 입력하세요"
                maxLength={13}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              />
            ) : (
              <p style={{ fontSize: '14px', color: '#000000' }}>{phoneNumber || '미입력'}</p>
            )}
          </div>
        </div>

        {/* 대여 통계 정보 */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#000000' }}>현재 대여 장비</span>
            <span style={{ fontWeight: 'bold', color: '#000000' }}>{currentRentals.length}개</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ color: '#000000' }}>대여 이력</span>
            <span style={{ fontWeight: 'bold', color: '#000000' }}>{rentalHistory.length}건</span>
          </div>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: '10px',
            color: penaltyPoints > 0 ? '#e53935' : '#000000'
          }}>
            <span>누적 벌점</span>
            <span style={{ fontWeight: 'bold' }}>{penaltyPoints}점</span>
          </div>
        </div>
      </div>

      {/* 서약서 업로드 섹션 */}
      <div style={{ 
        border: '1px solid #E0E0E0', 
        borderRadius: '10px',
        padding: '20px'
      }}>
        <h3 style={{ 
          fontSize: '16px', 
          fontWeight: 'bold', 
          marginBottom: '15px',
          display: 'flex',
          alignItems: 'center',
          color: '#000000'
        }}>
          <FileText size={18} style={{ marginRight: '8px' }} />
          대여 서약서
        </h3>

        <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
          장비 대여를 위해 서약서를 등록해주세요. 한 번만 등록하면 됩니다.
        </p>

        {agreementSubmitted && agreementURL && (
          <div style={{
            backgroundColor: '#e8f5e9',
            color: '#2e7d32',
            padding: '10px',
            borderRadius: '5px',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <CheckCircle size={16} style={{ marginRight: '8px' }} />
              서약서가 등록되었습니다.
            </div>
            <a 
              href={agreementURL} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{ 
                marginLeft: '10px', 
                fontSize: '14px', 
                color: '#2e7d32',
                textDecoration: 'underline'
              }}
            >
              보기
            </a>
          </div>
        )}

        {/* 서약서 등록 문구 */}
        {agreementSubmitted && (
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
            잘못 등록하셨나요?
          </p>
        )}

        {/* 파일 선택 버튼 */}
        <input 
          type="file" 
          onChange={handleFileChange}
          style={{ 
            marginBottom: '10px', 
            width: '100%',
            fontSize: '14px',
            color: '#000000'
          }}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.bmp,.gif,.webp,.heic"
        />

        {/* 업로드 진행 상태 표시 */}
        {isUploading && (
          <div style={{ marginBottom: '10px' }}>
            <div style={{ 
              width: '100%', 
              height: '5px', 
              backgroundColor: '#e0e0e0',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{ 
                height: '100%', 
                width: `${uploadProgress}%`,
                backgroundColor: '#4caf50',
                transition: 'width 0.3s'
              }} />
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '5px', textAlign: 'center' }}>
              {Math.round(uploadProgress)}% 업로드 중...
            </p>
          </div>
        )}

        {/* 서약서 등록 버튼 */}
        <button 
          onClick={uploadAgreement}
          disabled={!agreementFile || isUploading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: agreementFile && !isUploading ? '#4caf50' : '#212121',
            color: agreementFile && !isUploading ? 'white' : 'white',
            border: 'none',
            borderRadius: '7px',
            cursor: agreementFile && !isUploading ? 'pointer' : 'not-allowed'
          }}
        >
          {agreementSubmitted ? '서약서 다시 등록하기' : '서약서 등록하기'}
        </button>
      </div>
    </div>
  );
};

export default ProfileSidebar;