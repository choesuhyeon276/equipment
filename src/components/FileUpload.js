import React, { useState, useRef } from "react";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { storage } from "../trash/firebase";

function FileUpload() {
  const [progress, setProgress] = useState(0);
  const [downloadURL, setDownloadURL] = useState("");
  const fileInputRef = useRef(null);

  // 파일 선택과 업로드 핸들러 (한 번에 처리)
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const storageRef = ref(storage, `uploads/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(progress);
      },
      (error) => {
        console.error("파일 업로드 오류:", error.message);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((url) => {
          setDownloadURL(url);
          alert("파일 업로드 완료!");
        });
      }
    );
  };

  // FileUpload.jsx
onUploadComplete && onUploadComplete(downloadURL); // ✅ 여기서 URL 넘김

<FileUpload 
  onFileSelect={(fileName) => setSelectedFileName(fileName)}
  onUploadComplete={(fileURL) => {
    setUploadedFileName(fileURL);
    setIsReservationEnabled(true);
  }}
/>


  // 첨부하기 버튼 클릭 시 파일 선택 창 열기
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <>
      {/* 파일 입력창 - 숨김 */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
      {/* 첨부하기 버튼 */}
      <button onClick={triggerFileInput} style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px',
        width: '219px',
        height: '73px',
        backgroundColor: '#DFDFDF',
        borderRadius: '8px',
        fontSize: '36px',
        fontWeight: 'bold',
        fontFamily: 'Pretendard, sans-serif',
      }}>
        <img src={`${process.env.PUBLIC_URL}/assets/Note.png`} alt="첨부하기" style={{
          width: '36px',
          height: '36px'
        }} />
        첨부하기
      </button>
      {/* 업로드 상태 표시 */}
      {progress > 0 && <p>업로드 진행률: {progress.toFixed(2)}%</p>}
      {downloadURL && (
        <a href={downloadURL} target="_blank" rel="noopener noreferrer">
          업로드된 파일 보기
        </a>
      )}
    </>
  );
}

export default FileUpload;
