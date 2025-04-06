import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';



// 스타일을 객체로 분리
const styles = {
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
    left: '-10px',
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
    right: '118px',
    fontSize: '24px',
    lineHeight: '1',
    fontWeight: "200",
    letterSpacing: "-1.5px"
  },
  email: {
    position: 'absolute',
    bottom: '330px',
    right: '115px',
    fontSize: '24px',
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
  }
};

// 파일 업로드 컴포넌트
const FileUpload = ({ onFileSelect, onUploadComplete }) => {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');

  const auth = getAuth();
  const storage = getStorage();
  const firestore = getFirestore();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setFile(selectedFile);
    onFileSelect(selectedFile ? selectedFile.name : '');
  };

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
      const storageRef = ref(storage, `equipment_rentals/${user.uid}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          setUploadStatus('업로드 실패');
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

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
          
          if (onUploadComplete) {
            onUploadComplete(downloadURL);
          }
          
          setFile(null);
          setUploadProgress(0);
        }
      );

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('업로드 실패');
    }
  };

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
};

// 메인 페이지 컴포넌트
const LongTermRentalPage = () => {
  const navigate = useNavigate();
  const [selectedFileName, setSelectedFileName] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isReservationEnabled, setIsReservationEnabled] = useState(false);

  const handleReservation = async () => {
    if (!isReservationEnabled) {
      alert('파일을 먼저 업로드해주세요.');
      return;
    }
    navigate('/reservation-main', { 
      state: { 
        uploadedFileName: uploadedFileName
      } 
    });
    
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.contentContainer}>
        <img 
          src={`${process.env.PUBLIC_URL}/assets/Camera.png`} 
          alt="Camera" 
          style={styles.cameraImage} 
        />

        {/* 제목 및 설명 */}
        <div style={styles.headerText}>
          <div style={styles.mainTitle}>Long-term<br />equipment rental.</div>
          <div style={styles.subtitle}>김숭현 교수님의 승인이<br />필요합니다</div>
        </div>

        {/* 버튼 및 파일명 영역 */}
        <div style={styles.actionArea}>
          <div style={styles.buttonsRow}>
            <FileUpload 
              onFileSelect={(fileName) => setSelectedFileName(fileName)}
              onUploadComplete={(downloadURL) => { 
                console.log("✅ 업로드된 파일 URL:", downloadURL);       // ✅ 이 부분 수정
                setUploadedFileName(downloadURL);  
                setIsReservationEnabled(true);
              }}
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
          
          {uploadedFileName && (
            <div style={styles.uploadedMessage}>

            </div>
          )}
        </div>

        {/* 하단 안내사항 */}
        <div style={styles.noticeText}>
          ※ 촬영 관련 장비 / 카메라, 렌즈, 조명, 스탠드, 삼각대, 배터리는 대여가 불가능합니다<br />
          ※ 김숭현 교수님 연락처로 직접 연락하셔야 하며, 대화 내용을 첨부하셔야 합니다<br />
          ※ 필수 요소: 대여 품목, 대여 일시, 대여 목적
        </div>

        {/* 하단 연락처 */}
        <div style={styles.contactLabel}>
          TEL<br />
          E-MAIL
        </div>

        <div style={styles.phoneNumber}>
          010 - 3034 - 3317<br />
        </div>

        <div style={styles.email}>
          soong@khu.ac.kr
        </div>

        {/* 흰색 가로선 */}
        <div style={styles.separator}></div>
      </div>
    </div>
  );
};

export default LongTermRentalPage;