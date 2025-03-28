import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

          setUploadStatus('파일 업로드 완료');
          
          if (onUploadComplete) {
            onUploadComplete(file.name);
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
    <div style={{
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center',
      width: '219px',
      height: '180px',  // Fixed height to prevent layout shift
      position: 'relative',
    }}>
      <input 
        type="file" 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
        id="file-input"
      />
      <label 
        htmlFor="file-input" 
        style={{
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
        }}
      >
        <img src={`${process.env.PUBLIC_URL}/assets/Note.png`} alt="예약하기" style={{
          marginRight: '10px',
          width: '36px',
          height: '36px'
        }} />
        파일 첨부
      </label>

      {file && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%',
          marginTop: '10px',
        }}>
          <div style={{
            fontSize: '16px',
            color: '#333',
            maxWidth: '219px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'center'
          }}>
            {file.name}
          </div>
          
          <button 
            onClick={handleFileUpload}
            style={{
              marginTop: '10px',
              width: '100px',
              height: '30px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            업로드
          </button>
        </div>
      )}

      {uploadProgress > 0 && (
        <div style={{
          width: '219px',
          height: '10px',
          backgroundColor: '#e0e0e0',
          borderRadius: '5px',
          marginTop: '10px',
          overflow: 'hidden'
        }}>
          <div 
            style={{
              width: `${uploadProgress}%`,
              height: '100%',
              backgroundColor: '#4CAF50',
              transition: 'width 0.5s ease-in-out'
            }}
          />
        </div>
      )}

      {uploadStatus && (
        <div style={{
          marginTop: '10px',
          fontSize: '14px',
          color: uploadStatus.includes('실패') ? 'red' : 'green',
          textAlign: 'center'
        }}>
          {uploadStatus}
        </div>
      )}
    </div>
  );
};

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
    setTimeout(() => {
      window.location.reload();
    }, 100);
  };

  return (
    <div style={{
      position: 'relative',
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'black',
      overflow: 'hidden'
    }}>
      <div style={{
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
      }}>
        <img src={`${process.env.PUBLIC_URL}/assets/Camera.png`} alt="Camera" style={{
          position: 'absolute',
          top: '-60px',
          left: '-10px',
          width: '800px',
        }} />

        {/* 제목 및 설명 */}
        <div style={{
          position: 'absolute',
          top: '130px',
          right: '110px',
          textAlign: 'right'
        }}>
          <div style={{ fontSize: '66px', fontWeight: '900', lineHeight: '66px', textAlign: 'left' }}>Long-term<br />equipment rental.</div>
          <div style={{ fontSize: '60px', fontWeight: '200', marginTop: '10px', textAlign: 'left', lineHeight: '60px' }}>김숭현 교수님의 승인이<br />필요합니다</div>
        </div>

        {/* 버튼 및 파일명 영역 */}
        <div style={{
          position: 'absolute',
          bottom: '400px',
          right: '215px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: '20px'  // Increased gap for better spacing
        }}>
          <div style={{
            display: 'flex',
            gap: '20px',
            alignItems: 'flex-start',  // Align to top to prevent shifting
            height: '180px'  // Fixed height to match FileUpload
          }}>
            <FileUpload 
              onFileSelect={(fileName) => setSelectedFileName(fileName)}
              onUploadComplete={(fileName) => {
                setUploadedFileName(fileName);
                setIsReservationEnabled(true);
              }}
            />
            <button 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                width: '219px',
                height: '73px',
                backgroundColor: isReservationEnabled ? '#4CAF50' : '#DFDFDF',
                borderRadius: '8px',
                fontSize: '36px',
                fontWeight: 'bold',
                fontFamily: 'Pretendard, sans-serif',
                cursor: isReservationEnabled ? 'pointer' : 'not-allowed',
                color: isReservationEnabled ? 'white' : 'gray',
                opacity: isReservationEnabled ? 1 : 0.5,
                marginTop: '0'  // Remove any top margin to keep consistent position
              }}
              onClick={handleReservation}
              disabled={!isReservationEnabled}
            >
              <img 
                src={`${process.env.PUBLIC_URL}/assets/CheckMark.png`} 
                alt="예약하기" 
                style={{
                  width: '36px',
                  height: '36px',
                  filter: isReservationEnabled ? 'none' : 'grayscale(100%)'
                }} 
              />
              예약하기
            </button>
          </div>
          
          {uploadedFileName && (
            <div style={{
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
            }}>
              업로드 완료: {uploadedFileName}
            </div>
          )}
        </div>

        {/* 하단 안내사항 */}
        <div style={{
          position: 'absolute',
          bottom: '320px',
          left: '70px',
          fontSize: '24px',
          lineHeight: '26px',
          fontWeight: '200'
        }}>
          ※ 촬영 관련 장비 / 카메라, 렌즈, 조명, 스탠드, 삼각대, 배터리는 대여가 불가능합니다<br />
          ※ 김숭현 교수님 연락처로 직접 연락하셔야 하며, 대화 내용을 첨부하셔야 합니다<br />
          ※ 필수 요소: 대여 품목, 대여 일시, 대여 목적
        </div>

        {/* 하단 연락처 */}
        <div style={{
          position: 'absolute',
          bottom: '330px',
          right: '293px',
          fontSize: '24px',
          lineHeight: '1',
          fontWeight: "400",
          textAlign: "right"
        }}>
          TEL<br />
          E-MAIL
        </div>

        <div style={{
          position: 'absolute',
          bottom: '355px',
          right: '118px',
          fontSize: '24px',
          lineHeight: '1',
          fontWeight: "200",
          letterSpacing: "-1.5px"
        }}>
          010 - 3034 - 3317<br />
        </div>

        <div style={{
          position: 'absolute',
          bottom: '330px',
          right: '115px',
          fontSize: '24px',
          lineHeight: '1',
          fontWeight: "200",
          letterSpacing: "-1px"
        }}>
          soong@khu.ac.kr
        </div>

        {/* 흰색 가로선 */}
        <div style={{
          position: 'absolute',
          bottom: '320px',
          left: '985px',
          width: '340px',
          height: '2px',
          backgroundColor: 'black'
        }}></div>
      </div>
    </div>
  );
};

export default LongTermRentalPage;