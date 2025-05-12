import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';

// 스타일 객체 (외부 파일로도 분리 가능)
const styles = {
  // PC 버전 스타일
  uploadContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '219px',
    height: '180px',
    position: 'relative',
  },
  fileButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '219px',
    height: '73px',
    backgroundColor: '#DFDFDF',
    borderRadius: '8px',
    fontSize: '36px',
    fontWeight: 'bold',
    fontFamily: 'Pretendard, sans-serif',
    cursor: 'pointer'
  },
  buttonIcon: {
    marginRight: '10px',
    width: '36px',
    height: '36px'
  },
  fileInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    marginTop: '10px',
  },
  fileName: {
    fontSize: '16px',
    color: '#333',
    maxWidth: '219px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'center'
  },
  uploadButton: {
    marginTop: '10px',
    width: '100px',
    height: '30px',
    backgroundColor: '#2d2d2d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer'
  },
  progressContainer: {
    width: '219px',
    height: '10px',
    backgroundColor: '#e0e0e0',
    borderRadius: '5px',
    marginTop: '10px',
    overflow: 'hidden'
  },
  progressBar: (progress) => ({
    width: `${progress}%`,
    height: '100%',
    backgroundColor: '#2d2d2d',
    transition: 'width 0.5s ease-in-out'
  }),
  statusMessage: (isError) => ({
    marginTop: '10px',
    fontSize: '14px',
    color: isError ? 'red' : 'green',
    textAlign: 'center'
  }),
  // 예약 버튼 스타일
  reserveButton: (enabled) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '219px',
    height: '73px',
    backgroundColor: enabled ? '#808080' : '#DFDFDF',
    borderRadius: '8px',
    fontSize: '36px',
    fontWeight: 'bold',
    fontFamily: 'Pretendard, sans-serif',
    cursor: enabled ? 'pointer' : 'not-allowed',
    color: enabled ? 'white' : 'gray',
    opacity: enabled ? 1 : 0.5,
  }),
  reserveIcon: (enabled) => ({
    width: '36px',
    height: '36px',
    filter: enabled ? 'none' : 'grayscale(100%)'
  }),
  uploadedMessage: {
    position: 'absolute',
    left: "245px",
    bottom: "82px",
    fontSize: '14px',
    fontWeight: '600',
    color: '#4CAF50',
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  // 페이지 레이아웃 스타일
  pageContainer: {
    position: 'relative',
    width: '100vw',
    height: '850px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden'
  },
  contentContainer: {
    width: '1440px',
    height: '1080px',
    position: 'relative',
    backgroundColor: '#fff',
    color: '#000',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 'auto',
    fontFamily: 'Pretendard, sans-serif',
    border: '2px solid #fff',
    overflow: 'hidden',
  },
  cameraImage: {
    position: 'absolute',
    top: '-60px',
    left: '-0px',
    width: '800px',
  },
  headerText: {
    position: 'absolute',
    top: '130px',
    right: '110px',
    textAlign: 'right'
  },
  mainTitle: {
    fontSize: '66px',
    fontWeight: '900',
    lineHeight: '66px',
    textAlign: 'left'
  },
  subtitle: {
    fontSize: '60px',
    fontWeight: '200',
    marginTop: '10px',
    textAlign: 'left',
    lineHeight: '60px'
  },
  actionArea: {
    position: 'absolute',
    bottom: '400px',
    right: '215px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '20px'
  },
  buttonsRow: {
    display: 'flex',
    gap: '20px',
    alignItems: 'flex-start',
    height: '180px'
  },
  noticeText: {
    position: 'absolute',
    bottom: '320px',
    left: '70px',
    fontSize: '24px',
    lineHeight: '26px',
    fontWeight: '200'
  },
  contactLabel: {
    position: 'absolute',
    bottom: '330px',
    right: '293px',
    fontSize: '24px',
    lineHeight: '1',
    fontWeight: "400",
    textAlign: "right"
  },
  phoneNumber: {
    position: 'absolute',
    bottom: '355px',
    right: '110px',
    fontSize: '24px',
    lineHeight: '1',
    fontWeight: "200",
    letterSpacing: "-1.5px"
  },
  email: {
    position: 'absolute',
    bottom: '330px',
    right: '110px',
    fontSize: '23px',
    lineHeight: '1',
    fontWeight: "200",
    letterSpacing: "-1px"
  },
  separator: {
    position: 'absolute',
    bottom: '320px',
    left: '985px',
    width: '340px',
    height: '2px',
    backgroundColor: 'black'
  },
  footer: {
    width: '100%',
    textAlign: 'center',
    padding: '6px 0',
    fontSize: '12px',
    color: '#aaa',
    opacity: 1,
    position: 'absolute',
    bottom: '0px',
    left: 0
  },
  
  // 모바일 버전 스타일
  mobileContainer: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '30px 10px 10px 10px',
    position: 'relative'
  },
  mobileContent: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '0 10px',
    position: 'relative',
    fontFamily: 'Pretendard, sans-serif',
    color: '#000000',
  },
  mobileCameraImage: {
    width: '100%',
    maxWidth: '280px',
    marginTop: '10px',
    marginBottom: '20px',
    alignSelf: 'flex-start'
  },
  mobileHeaderText: {
    width: '100%',
    textAlign: 'left',
    marginBottom: '30px',
  },
  mobileMainTitle: {
    fontSize: '36px',
    fontWeight: '900',
    lineHeight: '1.1',
    marginBottom: '10px',
  },
  mobileSubtitle: {
    fontSize: '28px',
    fontWeight: '200',
    lineHeight: '1.2',
  },
  mobileActionArea: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    marginBottom: '30px'
  },
  mobileButtonsRow: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px'
  },
  mobileUploadContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '280px',
    marginBottom: '5px'
  },
  mobileFileButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: '60px',
    backgroundColor: '#DFDFDF',
    borderRadius: '8px',
    fontSize: '24px',
    fontWeight: 'bold',
    fontFamily: 'Pretendard, sans-serif',
    cursor: 'pointer'
  },
  mobileButtonIcon: {
    marginRight: '10px',
    width: '28px',
    height: '28px'
  },
  mobileUploadButton: {
    marginTop: '10px',
    width: '100px',
    height: '36px',
    backgroundColor: '#2d2d2d',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500'
  },
  mobileProgressContainer: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    marginTop: '10px',
    overflow: 'hidden'
  },
  mobileReserveButton: (enabled) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    maxWidth: '280px',
    height: '60px',
    backgroundColor: enabled ? '#808080' : '#DFDFDF',
    borderRadius: '8px',
    fontSize: '24px',
    fontWeight: 'bold',
    fontFamily: 'Pretendard, sans-serif',
    cursor: enabled ? 'pointer' : 'not-allowed',
    color: enabled ? 'white' : 'gray',
    opacity: enabled ? 1 : 0.5,
  }),
  mobileReserveIcon: (enabled) => ({
    width: '28px',
    height: '28px',
    filter: enabled ? 'none' : 'grayscale(100%)'
  }),
  mobileNoticeText: {
    width: '100%',
    fontSize: '16px',
    lineHeight: '1.6',
    fontWeight: '300',
    marginBottom: '25px',
    padding: '5px 10px',
    border: '1px solid #f0f0f0',
    borderRadius: '8px',
    backgroundColor: '#fafafa'
  },
  mobileFooter: {
    width: '100%',
    textAlign: 'center',
    padding: '10px 0',
    fontSize: '12px',
    color: '#888',
    marginTop: '30px',
    borderTop: '1px solid #eee'
  }
};

/**
 * 파일 업로드 컴포넌트
 * @param {Object} props - 컴포넌트 속성
 * @param {Function} props.onFileSelect - 파일 선택 콜백
 * @param {Function} props.onUploadComplete - 업로드 완료 콜백
 * @param {boolean} props.isMobile - 모바일 여부
 */
const FileUpload = ({ onFileSelect, onUploadComplete, isMobile }) => {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  const auth = getAuth();
  const storage = getStorage();
  const firestore = getFirestore();

  // 파일 선택 핸들러
  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    onFileSelect(selectedFile ? selectedFile.name : '');
  };

  // 파일 업로드 핸들러
  const handleFileUpload = async () => {
    if (!file) {
      setUploadStatus('파일을 선택해주세요.');
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setUploadStatus('로그인이 필요합니다.');
      return;
    }

    try {
      // 스토리지 경로 설정
      const storageRef = ref(storage, `equipment_rentals/${user.uid}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      // 업로드 상태 모니터링
      uploadTask.on('state_changed', 
        // 진행 상태 업데이트
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadProgress(progress);
        },
        // 오류 처리
        (error) => {
          console.error('Upload error:', error);
          setUploadStatus('업로드 실패');
        },
        // 완료 처리
        async () => {
          // 다운로드 URL 가져오기
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

          // Firestore에 파일 정보 저장
          await addDoc(collection(firestore, 'equipment_rental_files'), {
            name: user.displayName || user.email,
            userId: user.uid,
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            downloadURL: downloadURL,
            uploadedAt: serverTimestamp()
          });

          setUploadStatus('');
          
          // 완료 콜백 호출
          if (onUploadComplete) {
            onUploadComplete(downloadURL);
          }
          
          // 상태 초기화
          setFile(null);
          setUploadProgress(0);
        }
      );
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('업로드 실패');
    }
  };

  // 모바일 버전 UI
  if (isMobile) {
    return renderMobileFileUpload();
  }

  // PC 버전 UI
  return renderPCFileUpload();

  // 모바일 버전 렌더링 함수
  function renderMobileFileUpload() {
    return (
      <div style={styles.mobileUploadContainer}>
        <input 
          type="file" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="file-input-mobile"
        />
        <label htmlFor="file-input-mobile" style={styles.mobileFileButton}>
          <img 
            src={`${process.env.PUBLIC_URL}/assets/Note.png`} 
            alt="파일 첨부" 
            style={styles.mobileButtonIcon} 
          />
          파일 첨부
        </label>

        {file && (
          <button 
            onClick={handleFileUpload}
            style={styles.mobileUploadButton}
          >
            업로드
          </button>
        )}

        {uploadProgress > 0 && (
          <div style={styles.mobileProgressContainer}>
            <div style={styles.progressBar(uploadProgress)} />
          </div>
        )}

        {uploadStatus && (
          <div style={styles.statusMessage(uploadStatus.includes('실패'))}>
            {uploadStatus}
          </div>
        )}
      </div>
    );
  }

  // PC 버전 렌더링 함수
  function renderPCFileUpload() {
    return (
      <div style={styles.uploadContainer}>
        <input 
          type="file" 
          onChange={handleFileChange} 
          style={{ display: 'none' }} 
          id="file-input"
        />
        <label htmlFor="file-input" style={styles.fileButton}>
          <img 
            src={`${process.env.PUBLIC_URL}/assets/Note.png`} 
            alt="파일 첨부" 
            style={styles.buttonIcon} 
          />
          파일 첨부
        </label>

        {file && (
          <button 
            onClick={handleFileUpload}
            style={styles.uploadButton}
          >
            업로드
          </button>
        )}

        {uploadProgress > 0 && (
          <div style={styles.progressContainer}>
            <div style={styles.progressBar(uploadProgress)} />
          </div>
        )}

        {uploadStatus && (
          <div style={styles.statusMessage(uploadStatus.includes('실패'))}>
            {uploadStatus}
          </div>
        )}
      </div>
    );
  }
};

/**
 * 메인 페이지 컴포넌트
 */
const LongTermRentalPage = () => {
  const navigate = useNavigate();
  const [selectedFileName, setSelectedFileName] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isReservationEnabled, setIsReservationEnabled] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // 화면 크기 변화 감지
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  // 예약 버튼 클릭 핸들러
  const handleReservation = async () => {
    if (!isReservationEnabled) {
      toast.warn('파일을 먼저 업로드해주세요.');
      return;
    }
    navigate('/reservation-main', { 
      state: { 
        uploadedFileName: uploadedFileName
      } 
    });
  };

  // 파일 업로드 완료 핸들러
  const handleUploadComplete = (downloadURL) => {
    console.log("✅ 업로드된 파일 URL:", downloadURL);
    setUploadedFileName(downloadURL);  
    setIsReservationEnabled(true);
  };

  // 모바일 버전 렌더링
  if (isMobile) {
    return renderMobileVersion();
  }

  // PC 버전 렌더링
  return renderPCVersion();

  // 모바일 버전 렌더링 함수
  function renderMobileVersion() {
    return (
      <div style={styles.mobileContainer}>
        <div style={styles.mobileContent}>
          {/* 제목 및 설명 */}
          <div style={styles.mobileHeaderText}>
            <div style={styles.mobileMainTitle}>Long-term<br />equipment rental.</div>
            <div style={styles.mobileSubtitle}>디콘 장비장의 승인이<br />필요합니다</div>
          </div>

          {/* 버튼 영역 */}
          <div style={styles.mobileActionArea}>
            <div style={styles.mobileButtonsRow}>
              <FileUpload 
                isMobile={true}
                onFileSelect={setSelectedFileName}
                onUploadComplete={handleUploadComplete}
              />
              <button 
                style={styles.mobileReserveButton(isReservationEnabled)}
                onClick={handleReservation}
                disabled={!isReservationEnabled}
              >
                <img 
                  src={`${process.env.PUBLIC_URL}/assets/CheckMark.png`} 
                  alt="예약하기" 
                  style={styles.mobileReserveIcon(isReservationEnabled)} 
                />
                예약하기
              </button>
            </div>
          </div>

          {/* 하단 안내사항 */}
          {renderMobileNotice()}
          
          {/* 푸터 */}
          <div style={styles.mobileFooter}>
            © Made by 2024104520 최수현 · Sepcial Thanks:) 2025 학생회 장비장 ZIP 김태윤선배 · Build: v1.1.0
          </div>
        </div>
      </div>
    );
  }

  // PC 버전 렌더링 함수
  function renderPCVersion() {
    return (
      <div style={styles.pageContainer}>
        <div style={styles.contentContainer}>
          {/* 카메라 이미지 */}
          <img 
            src={`${process.env.PUBLIC_URL}/assets/Camera.png`} 
            alt="Camera" 
            style={styles.cameraImage} 
          />

          {/* 제목 및 설명 */}
          <div style={styles.headerText}>
            <div style={styles.mainTitle}>Long-term<br />equipment rental.</div>
            <div style={styles.subtitle}>디콘 장비장의 승인이<br />필요합니다</div>
          </div>

          {/* 버튼 및 파일명 영역 */}
          <div style={styles.actionArea}>
            <div style={styles.buttonsRow}>
              <FileUpload 
                onFileSelect={setSelectedFileName}
                onUploadComplete={handleUploadComplete}
              />
              <button 
                style={styles.reserveButton(isReservationEnabled)}
                onClick={handleReservation}
                disabled={!isReservationEnabled}
              >
                <img 
                  src={`${process.env.PUBLIC_URL}/assets/CheckMark.png`} 
                  alt="예약하기" 
                  style={styles.reserveIcon(isReservationEnabled)} 
                />
                예약하기
              </button>
            </div>
            
            {/* 업로드 완료 메시지 */}
            {uploadedFileName && (
              <div style={styles.uploadedMessage}></div>
            )}
          </div>

          {/* 하단 안내사항 */}
          <div style={styles.noticeText}>
            ※ 촬영 관련 장비 / 카메라, 렌즈, 조명, 스탠드, 삼각대, 배터리는 대여가 불가능합니다<br />
            ※ 김나영 장비장 연락처로 직접 연락하셔야 하며, 대화 내용을 첨부하셔야 합니다<br />
            ※ 필수 요소: 대여 품목, 대여 일시, 대여 목적
          </div>

          {/* 하단 연락처 영역 */}
          {renderContactInfo()}

          {/* 흰색 가로선 */}
          <div style={styles.separator}></div>
        </div>
        
        {/* 푸터 */}
        <div style={styles.footer}>
          © Made by 2024104520 최수현 · Sepcial Thanks:) 2025 학생회 장비장 ZIP 김태윤선배 · Build: v1.1.0
        </div>
      </div>
    );
  }

  // 모바일 안내사항 렌더링 함수
  function renderMobileNotice() {
    return (
      <div style={styles.mobileNoticeText}>
        <span style={{fontWeight: '600', fontSize: '18px', display: 'block', marginBottom: '12px', color: '#333333'}}>※ 중요 안내사항</span>
        <span style={{fontWeight: '400', color: '#444444', display: 'flex', alignItems: 'flex-start', marginBottom: '8px'}}>
          <span style={{marginRight: '6px', color: '#555'}}>•</span>
          <span>촬영 관련 장비 (카메라, 렌즈, 조명, 스탠드, 삼각대, 배터리)는 대여가 불가능합니다</span>
        </span>
        <span style={{fontWeight: '400', color: '#444444', display: 'flex', alignItems: 'flex-start', marginBottom: '8px'}}>
          <span style={{marginRight: '6px', color: '#555'}}>•</span>
          <span>김나영 장비장 연락처로 직접 연락하셔야 하며, 대화 내용을 첨부하셔야 합니다</span>
        </span>
        <span style={{fontWeight: '400', color: '#444444', display: 'flex', alignItems: 'flex-start'}}>
          <span style={{marginRight: '6px', color: '#555'}}>•</span>
          <span>필수 요소: 대여 품목, 대여 일시, 대여 목적</span>
        </span>
      </div>
    );
  }

  // 연락처 정보 렌더링 함수
  function renderContactInfo() {
    return (
      <>
        <div style={styles.contactLabel}>
          TEL<br />
          E-MAIL
        </div>
        <div style={styles.phoneNumber}>
          010 - 7667 - 9373<br />
        </div>
        <div style={styles.email}>
          Gkrry24@khu.ac.kr
        </div>
      </>
    );
  }
};

export default LongTermRentalPage;