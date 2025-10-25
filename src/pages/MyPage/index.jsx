// src/pages/MyPage/index.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, updateDoc, collection, getDocs, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { db, storage, ref, uploadBytesResumable, getDownloadURL } from '../../firebase/firebaseConfig';
import { toast } from 'react-toastify';

// 컴포넌트 임포트
import Header from './components/Header';
import MissingInfoNotice from './components/MissingInfoNotice';
import ProfileSidebar from './components/ProfileSidebar';
import RentalTabs from './components/RentalTabs';

// 유틸리티 함수 
import { compressImage } from './utils/imageUtils';
import { formatPhoneNumber } from './utils/formatters';

const MyPage = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  
  // 반응형 상태
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  // 사용자 상태
  const [user, setUser] = useState(null);
  const [studentId, setStudentId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [agreementFile, setAgreementFile] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [activeTab, setActiveTab] = useState('current');
  
  // 데이터 상태
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState({});
  const [currentRentals, setCurrentRentals] = useState([]);
  const [pendingRentals, setPendingRentals] = useState([]);
  const [returnRequestedRentals, setReturnRequestedRentals] = useState([]);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  const [penaltyPoints, setPenaltyPoints] = useState(0);
  const [agreementSubmitted, setAgreementSubmitted] = useState(false);
  const [agreementURL, setAgreementURL] = useState('');
  
  // 업로드 관련 상태
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedReturnImages, setUploadedReturnImages] = useState({});
  
  // 윈도우 크기 변경 감지
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 인증 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // 인증된 사용자
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || '사용자'
        };
        setUser(userData);
        fetchUserData(userData.uid);
      } else {
        // 미인증 사용자 처리
        setUser(null);
        setLoading(false);
        navigate('/login');
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);
  
  // 사용자 데이터 로드
  const fetchUserData = async (userId) => {
    try {
      setLoading(true);
      
      // 사용자 프로필 데이터 불러오기
      const userProfileRef = doc(db, 'user_profiles', userId);
      const userProfileDoc = await getDoc(userProfileRef);
      
      if (userProfileDoc.exists()) {
        const profileData = userProfileDoc.data();
        setUserProfile(profileData);
        setPenaltyPoints(profileData.penaltyPoints || 0);
        setAgreementSubmitted(profileData.agreementSubmitted || false);
        setStudentId(profileData.studentId || '');
        setPhoneNumber(profileData.phoneNumber || '');
        
        if (profileData.agreementURL) {
          setAgreementURL(profileData.agreementURL);
        }
      } else {
        // 프로필이 없으면 생성
        await updateDoc(userProfileRef, {
          penaltyPoints: 0,
          agreementSubmitted: false,
          studentId: '',
          phoneNumber: '',
          createdAt: serverTimestamp()
        });
      }
  
      // 모든 예약 데이터 불러와서 순번 매기기
      const allReservationsQuery = query(
        collection(db, 'reservations'),
        where('userId', '==', userId),
        where('status', 'in', ['returned', 'active', 'pending', 'return_requested'])
      );
      const allReservationsSnapshot = await getDocs(allReservationsQuery);
  
      const sortedReservations = allReservationsSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => {
          const aTime = a.createdAt?.toDate?.() ?? new Date(0);
          const bTime = b.createdAt?.toDate?.() ?? new Date(0);
          return aTime - bTime;
        });
  
      const reservationCountMap = {};
      sortedReservations.forEach((reservation, index) => {
        reservationCountMap[reservation.id] = index + 1;
      });
  
      // 현재 대여 가져오기
      const currentRentalsQuery = query(
        collection(db, 'reservations'),
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      const currentRentalsSnapshot = await getDocs(currentRentalsQuery);
      const currentRentalsData = currentRentalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        rentalCount: reservationCountMap[doc.id] || 0
      }));
      setCurrentRentals(currentRentalsData);

      // 대여 신청 중
      const pendingQuery = query(
        collection(db, 'reservations'),
        where('userId', '==', userId),
        where('status', '==', 'pending')
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingData = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        rentalCount: reservationCountMap[doc.id] || 0
      }));
      setPendingRentals(pendingData);

      // 반납 요청 중
      const returnRequestedQuery = query(
        collection(db, 'reservations'),
        where('userId', '==', userId),
        where('status', '==', 'return_requested')
      );
      const returnRequestedSnapshot = await getDocs(returnRequestedQuery);
      const returnRequestedData = returnRequestedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        rentalCount: reservationCountMap[doc.id] || 0
      }));
      setReturnRequestedRentals(returnRequestedData);
  
      // 이력 불러오기
      const historyQuery = query(
        collection(db, 'reservations'),
        where('userId', '==', userId),
        where('status', '==', 'returned')
      );
      const historySnapshot = await getDocs(historyQuery);
      const historyData = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        rentalCount: reservationCountMap[doc.id] || 0
      }));
      setRentalHistory(historyData);
  
      // 이미지 URL 가져오기
      const allItems = [...currentRentalsData, ...historyData, ...pendingData, ...returnRequestedData];
      if (allItems.length > 0) {
        const urls = {};
        
        for (const item of allItems) {
          if (item.items && item.items.length > 0) {
            const firstItem = item.items[0];
            if (firstItem.imageURL) {
              urls[item.id] = firstItem.imageURL;
            } else {
              urls[item.id] = null;
            }
          }
        }
        
        setImageUrls(urls);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };
  
  // 프로필 정보 업데이트
  const updateProfileData = async () => {
    if (!user) return;
    
    try {
      const userProfileRef = doc(db, 'user_profiles', user.uid);
      await updateDoc(userProfileRef, {
        studentId: studentId,
        phoneNumber: phoneNumber,
        updatedAt: serverTimestamp()
      });
      
      // 저장 성공 후 바로 로컬 userProfile도 수정
      setUserProfile((prev) => ({
        ...prev,
        studentId: studentId,
        phoneNumber: phoneNumber,
      }));

      toast.success('프로필 정보가 업데이트되었습니다.');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile data:', error);
      toast.warn('프로필 정보 업데이트에 실패했습니다.');
    }
  };
  
  // 서약서 업로드
  const uploadAgreement = async () => {
    if (!agreementFile || !user) return;
    
    setIsUploading(true);
    
    // Create a reference to the agreement file in storage
    const storageRef = ref(storage, `agreements/${user.uid}/${agreementFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, agreementFile);
    
    // Monitor upload progress
    uploadTask.on('state_changed', 
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        console.error('Error uploading agreement:', error);
        setIsUploading(false);
        toast.error('서약서 업로드 중 오류가 발생했습니다.');
      },
      async () => {
        // Get download URL and update user profile
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        try {
          const userProfileRef = doc(db, 'user_profiles', user.uid);
          await updateDoc(userProfileRef, {
            agreementSubmitted: true,
            agreementURL: downloadURL,
            agreementFilename: agreementFile.name,
            agreementUploadedAt: serverTimestamp()
          });

          setUserProfile((prev) => ({
            ...prev,
            agreementURL: downloadURL,
            agreementSubmitted: true
          }));
          
          setAgreementSubmitted(true);
          setAgreementURL(downloadURL);
          setIsUploading(false);
          setUploadProgress(0);
          toast.success('대여 서약서가 성공적으로 등록되었습니다.');
        } catch (error) {
          console.error('Error updating user profile:', error);
          setIsUploading(false);
          toast.error('서약서 정보 저장에 실패했습니다.');
        }
      }
    );
  };
  
  // 파일 선택 핸들러
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setAgreementFile(e.target.files[0]);
    }
  };
  
  // 아이템 확장 토글
  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };
  
  // ⭐ 예약 취소 핸들러 (Cloud Function 사용)
  const cancelReservation = async (reservationId) => {
    if (!window.confirm('정말로 대여를 취소하시겠습니까?')) return;
    
    try {
      // 1. 예약 정보 가져오기
      const reservation = currentRentals.find(r => r.id === reservationId) || 
                         pendingRentals.find(r => r.id === reservationId);
      
      if (!reservation) {
        throw new Error('예약 정보를 찾을 수 없습니다.');
      }

      console.log('🔍 예약 정보:', reservation);
      console.log('📅 캘린더 이벤트 ID:', reservation.calendarEventId);

      // 2. Firestore에서 예약 취소
      const reservationRef = doc(db, 'reservations', reservationId);
      await updateDoc(reservationRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
      console.log('✅ Firestore 예약 취소 완료');

      // 3. 캘린더 이벤트 삭제 (Cloud Function 호출)
      if (reservation.calendarEventId) {
        console.log('🔄 캘린더 이벤트 삭제 시도:', reservation.calendarEventId);
        
        try {
          // ⭐ Cloud Function 엔드포인트 URL
          const deleteEndpoint = 'https://us-central1-equipment-rental-system-838f0.cloudfunctions.net/deleteCalendarEvent';
          
          const response = await fetch(deleteEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              eventId: reservation.calendarEventId,
              calendarId: process.env.REACT_APP_GOOGLE_CALENDAR_ID || 'primary'
            })
          });

          const result = await response.json();
          
          if (result.success) {
            console.log('✅ 캘린더 이벤트 삭제 완료');
          } else {
            console.warn('⚠️ 캘린더 이벤트 삭제 실패:', result.error);
          }
        } catch (calError) {
          console.error('❌ 캘린더 이벤트 삭제 실패:', calError);
          // 캘린더 삭제 실패해도 예약은 취소됨
        }
      } else {
        console.warn('⚠️ calendarEventId가 없습니다.');
      }

      toast.success('대여가 취소되었습니다.');
      
      // 4. 데이터 새로고침
      if (user) {
        await fetchUserData(user.uid);
      }
      
    } catch (error) {
      console.error('❌ 취소 실패:', error);
      toast.error('취소 중 오류가 발생했습니다: ' + error.message);
    }
  };
  
  // 반납 요청 핸들러
  const handleReturnRequest = async (itemId) => {
    try {
      await updateDoc(doc(db, 'reservations', itemId), {
        status: 'return_requested',
        returnRequestedAt: serverTimestamp(),
      });
      toast.success('반납 요청이 제출되었습니다.');
      
      // 데이터 새로고침
      if (user) fetchUserData(user.uid);
    } catch (err) {
      console.error('반납 요청 실패:', err);
      toast.warn('반납 요청에 실패했습니다.');
    }
  };
  
  // 반납 이미지 업로드 핸들러
  const handleReturnImageUpload = async (e, reservationId) => {
    const file = e.target.files[0];
    if (!file || !reservationId) return;
    
    try {
      // 이미지 압축
      const compressedBlob = await compressImage(file, 800, 0.7);
      
      const storageRef = ref(storage, `returnImages/${reservationId}/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob);
      
      uploadTask.on('state_changed',
        (snapshot) => {
          // 업로드 진행 상태 처리 (필요하면 추가)
        },
        (error) => {
          console.error('이미지 업로드 실패:', error);
          toast.warn('이미지 업로드에 실패했습니다.');
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          await updateDoc(doc(db, 'reservations', reservationId), {
            returnImageURL: downloadURL,
            returnImageUploadedAt: serverTimestamp(),
          });
          
          setUploadedReturnImages(prev => ({
            ...prev,
            [reservationId]: true
          }));
          
          toast.success('반납 사진이 성공적으로 업로드되었습니다.');
        }
      );
    } catch (error) {
      console.error('이미지 처리 오류:', error);
      toast.error('이미지 처리 중 오류가 발생했습니다.');
    }
  };
  
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: isMobile ? '100%' : '1440px',
      minHeight: '100vh',
      background: '#FFFFFF',
      margin: '0 auto',
      fontFamily: 'Pretendard, sans-serif',
      color: '#000000',
      paddingBottom: isMobile ? '20px' : '0'
    }}>
      {/* 헤더 */}
      <Header user={user} isMobile={isMobile} />
      
      {/* 미입력 정보 알림 */}
      <MissingInfoNotice
        userProfile={userProfile}
        studentId={studentId}
        setStudentId={setStudentId}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        agreementFile={agreementFile}
        setAgreementFile={setAgreementFile}
        isUploading={isUploading}
        agreementSubmitted={agreementSubmitted}
        uploadAgreement={uploadAgreement}
        updateProfileData={updateProfileData}
        isMobile={isMobile}
      />
      
      {/* 메인 컨텐츠 영역 */}
      <div style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? '15px' : '30px',
        paddingTop: isMobile ? '20px' : '80px',
        paddingLeft: isMobile ? '10px' : '50px',
        paddingRight: isMobile ? '10px' : '50px',
        paddingBottom: '20px'
      }}>
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '50px',
            width: '100%'
          }}>
            
          </div>
        ) : (
          <>
            {/* 프로필 사이드바 */}
            <ProfileSidebar
              user={user}
              studentId={studentId}
              setStudentId={setStudentId}
              phoneNumber={phoneNumber}
              setPhoneNumber={setPhoneNumber}
              penaltyPoints={penaltyPoints}
              agreementSubmitted={agreementSubmitted}
              agreementURL={agreementURL}
              agreementFile={agreementFile}
              setAgreementFile={setAgreementFile}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              uploadAgreement={uploadAgreement}
              isEditing={isEditing}
              setIsEditing={setIsEditing}
              updateProfileData={updateProfileData}
              currentRentals={currentRentals}
              rentalHistory={rentalHistory}
              handleFileChange={handleFileChange}
              isMobile={isMobile}
            />
            
            {/* 대여 탭 */}
            <RentalTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              currentRentals={currentRentals}
              pendingRentals={pendingRentals}
              returnRequestedRentals={returnRequestedRentals}
              rentalHistory={rentalHistory}
              expandedItems={expandedItems}
              toggleExpand={toggleExpand}
              imageUrls={imageUrls}
              handleReturnRequest={handleReturnRequest}
              handleReturnImageUpload={handleReturnImageUpload}
              uploadedReturnImages={uploadedReturnImages}
              cancelReservation={cancelReservation}
              isMobile={isMobile}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default MyPage;