// src/pages/MyPage/hooks/useRentalActions.jsx
import { useState } from 'react';
import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import { compressImage } from '../utils/imageUtils';

/**
 * 대여 관련 액션을 처리하는 훅
 * @param {Object} db - Firebase Firestore 데이터베이스 객체
 * @param {Object} storage - Firebase Storage 객체
 * @param {Function} fetchUserData - 사용자 데이터를 새로고침하는 함수
 * @returns {Object} - 대여 관련 액션 함수들
 */
const useRentalActions = (db, storage, fetchUserData) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedReturnImages, setUploadedReturnImages] = useState({});

  /**
   * 반납 요청 처리
   * @param {string} itemId - 대여 아이템 ID
   */
  const handleReturnRequest = async (itemId) => {
    try {
      const itemRef = doc(db, 'reservations', itemId);
      await updateDoc(itemRef, {
        status: 'return_requested',
        returnRequestedAt: serverTimestamp(),
      });
      toast.success('반납 요청이 제출되었습니다.');
      
      // UI 반영을 위해 데이터 새로고침
      fetchUserData();
    } catch (err) {
      console.error('반납 요청 실패:', err);
      toast.warn('반납 요청에 실패했습니다.');
    }
  };

  /**
   * 반납 이미지 업로드 처리
   * @param {Event} e - 파일 선택 이벤트
   * @param {string} reservationId - 대여 ID
   */
  const handleReturnImageUpload = async (e, reservationId) => {
    const file = e.target.files[0];
    if (!file || !reservationId) return;
  
    try {
      // 이미지 압축
      const compressedBlob = await compressImage(file, 800, 0.7);
    
      // 스토리지 참조 생성
      const storageRef = ref(storage, `returnImages/${reservationId}/${file.name}`);
      
      setIsUploading(true);
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob);
    
      // 업로드 상태 모니터링
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('이미지 업로드 실패:', error);
          toast.warn('이미지 업로드에 실패했습니다.');
          setIsUploading(false);
        },
        async () => {
          // 업로드 완료 시 URL 가져오기
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Firestore 데이터 업데이트
          await updateDoc(doc(db, 'reservations', reservationId), {
            returnImageURL: downloadURL,
            returnImageUploadedAt: serverTimestamp(),
          });
      
          // 업로드 완료 상태 저장
          setUploadedReturnImages(prev => ({
            ...prev,
            [reservationId]: true
          }));
      
          setIsUploading(false);
          setUploadProgress(0);
          toast.success('반납 사진이 성공적으로 업로드되었습니다.');
        }
      );
    } catch (error) {
      console.error('반납 이미지 처리 오류:', error);
      toast.error('이미지 처리 중 오류가 발생했습니다.');
      setIsUploading(false);
    }
  };

  /**
   * 대여 신청 취소 처리
   * @param {string} reservationId - 예약 ID
   */
  const cancelReservation = async (reservationId) => {
    try {
      await updateDoc(doc(db, 'reservations', reservationId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
      toast.success('예약이 취소되었습니다.');
      
      // UI 반영을 위해 데이터 새로고침
      fetchUserData();
    } catch (err) {
      console.error('예약 취소 실패:', err);
      toast.warn('예약 취소에 실패했습니다.');
    }
  };

  /**
   * 서약서 업로드 처리
   * @param {Object} agreementFile - 업로드할 서약서 파일
   * @param {string} userId - 사용자 ID
   */
  const uploadAgreement = async (agreementFile, userId) => {
    if (!agreementFile || !userId) return;
    
    setIsUploading(true);
    setUploadProgress(0);
    
    // 스토리지 참조 생성
    const storageRef = ref(storage, `agreements/${userId}/${agreementFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, agreementFile);
    
    // 업로드 상태 모니터링
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error('서약서 업로드 오류:', error);
        toast.error('서약서 업로드에 실패했습니다.');
        setIsUploading(false);
      },
      async () => {
        // 업로드 완료 시 URL 가져오기
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        try {
          // 사용자 프로필 업데이트
          const userProfileRef = doc(db, 'user_profiles', userId);
          await updateDoc(userProfileRef, {
            agreementSubmitted: true,
            agreementURL: downloadURL,
            agreementFilename: agreementFile.name,
            agreementUploadedAt: serverTimestamp()
          });
          
          setIsUploading(false);
          setUploadProgress(0);
          toast.success('대여 서약서가 성공적으로 등록되었습니다.');
          
          // UI 반영을 위해 데이터 새로고침
          fetchUserData();
        } catch (error) {
          console.error('프로필 업데이트 오류:', error);
          toast.error('서약서 정보 저장에 실패했습니다.');
          setIsUploading(false);
        }
      }
    );
  };

  /**
   * 프로필 정보 업데이트 처리
   * @param {string} userId - 사용자 ID
   * @param {string} studentId - 학번
   * @param {string} phoneNumber - 전화번호
   */
  const updateProfileData = async (userId, studentId, phoneNumber) => {
    if (!userId) return;
    
    try {
      const userProfileRef = doc(db, 'user_profiles', userId);
      await updateDoc(userProfileRef, {
        studentId: studentId,
        phoneNumber: phoneNumber,
        updatedAt: serverTimestamp()
      });
      
      toast.success('프로필 정보가 업데이트되었습니다.');
      
      // UI 반영을 위해 데이터 새로고침
      fetchUserData();
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      toast.error('프로필 정보 업데이트에 실패했습니다.');
    }
  };

  return {
    isUploading,
    uploadProgress,
    uploadedReturnImages,
    handleReturnRequest,
    handleReturnImageUpload,
    cancelReservation,
    uploadAgreement,
    updateProfileData
  };
};

export default useRentalActions;