import React, { useState, useEffect } from 'react';
import { User, ShoppingCart, Clock, FileText, AlertTriangle, ChevronDown, ChevronUp, CheckCircle, Edit, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  app,
  db,
  getAuth,
  doc,
  getDoc,
  updateDoc,
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  getImageURL,
  serverTimestamp,
  storage,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from '../firebase/firebaseConfig';





const formatKoreanDateTime = (isoString) => {
  if (!isoString) return '날짜 없음';
  const date = new Date(isoString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // 0부터 시작함
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');

  return `${year}년 ${month}월 ${day}일 ${hour}시 ${minute}분`;
};

const formatFullKoreanDateTime = (timestamp) => {
  if (!timestamp || !timestamp.toDate) return '날짜 없음';
  
  const date = timestamp.toDate(); // Firebase Timestamp → JS Date

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  let hour = date.getHours();
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  const ampm = hour < 12 ? '오전' : '오후';
  hour = hour % 12 || 12; // 0시는 12시로 표시

  return `${year}년 ${month}월 ${day}일 ${ampm} ${hour}시 ${minute}분 ${second}초`;
};

const getUserRentalCount = async (userId) => {
  try {
    const rentalQuery = query(
      collection(db, 'reservations'),
      where('userId', '==', userId),
      where('status', 'in', ['returned', 'active', 'pending', 'return_requested'])
    );
    const snapshot = await getDocs(rentalQuery);
    return snapshot.size;
  } catch (error) {
    console.error('대여 횟수 조회 실패:', error);
    return 0;
  }
};



const MyPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [currentRentals, setCurrentRentals] = useState([]);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [agreementSubmitted, setAgreementSubmitted] = useState(false);
  const [agreementFile, setAgreementFile] = useState(null);
  const [agreementURL, setAgreementURL] = useState('');
  const [penaltyPoints, setPenaltyPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState({});
  const [activeTab, setActiveTab] = useState('current');
  const [expandedItems, setExpandedItems] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedReturnImages, setUploadedReturnImages] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pendingRentals, setPendingRentals] = useState([]);
  const [returnRequestedRentals, setReturnRequestedRentals] = useState([]);

  const cancelReservation = async (reservationId) => {
    try {
      await updateDoc(doc(db, 'reservations', reservationId), {
        status: 'cancelled',
        cancelledAt: serverTimestamp()
      });
      alert('예약이 취소되었습니다.');
    } catch (err) {
      console.error('예약 취소 실패:', err);
      alert('예약 취소에 실패했습니다.');
      return; // ❗ 실패했으면 더 이상 진행 안 해도 돼
    }
  
    // ✅ 별도로 fetchUserData 실행
    if (user) {
      try {
        await fetchUserData(user.uid);
      } catch (fetchErr) {
        console.error('유저 데이터 리프레시 실패:', fetchErr);
      }
    }
  };


  const groupHistoryByDateTime = (items) => {
    const grouped = {};
  
    items.forEach(item => {
      const key = `${item.rentalDate || item.startDateTime}_${item.rentalTime || ''}_${item.returnDate || item.endDateTime}_${item.returnTime || ''}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(item);
    });
  
    return grouped;
  };

  const handleReturnRequest = async (itemId) => {
    try {
      const itemRef = doc(db, 'reservations', itemId); // rentals일 수도 있음
      await updateDoc(itemRef, {
        status: 'return_requested',
        returnRequestedAt: serverTimestamp(),
      });
      alert('반납 요청이 제출되었습니다.');
      // UI 반영 위해 fetchUserData 재호출
      if (user) fetchUserData(user.uid);
    } catch (err) {
      console.error('반납 요청 실패:', err);
      alert('반납 요청에 실패했습니다.');
    }
  };
   
  



  
  // 내비게이션 핸들러
  const handleHomeNavigation = () => {
    navigate('/main');
  };

  const handleCalendarNavigation = () => {
    navigate('/calendar', { state: { scrollTo: 'calendar-section' } });
  };

  const handleNoteNavigation = () => {
    navigate('/thingsnote', { state: { scrollTo: 'notes-section' } });
  };

  const handleCartNavigation = () => {
    navigate('/cart');
  };
  
  const handleReservateNavigation = () => {
    navigate('/ReservationMainPage');
  };

  // Page load - authentication and data fetching
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        // Firebase 유저 인증이 되어 있는 경우
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName || '사용자'
        };

        setUser(userData);
        fetchUserData(firebaseUser.uid);

        // localStorage에도 다시 저장 (선택적)
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        console.log('Firebase 인증된 유저 없음');
        setUser(null);
        setLoading(false);
        // 로그인 페이지로 보낼 수도 있음
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, []);


  // Fetch all user data from Firebase
  const fetchUserData = async (userId) => {
    try {
      // 사용자 프로필 데이터 불러오기
      const userProfileRef = doc(db, 'user_profiles', userId);
      const userProfileDoc = await getDoc(userProfileRef);
      
      if (userProfileDoc.exists()) {
        const profileData = userProfileDoc.data();
        setPenaltyPoints(profileData.penaltyPoints || 0);
        setAgreementSubmitted(profileData.agreementSubmitted || false);
        setStudentId(profileData.studentId || '');
        setPhoneNumber(profileData.phoneNumber || '');
        if (profileData.agreementUrl) {
          setAgreementURL(profileData.agreementUrl);
        }
      

      } else {
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
  
      // 이미지 통합해서 로딩
      const allItems = [...currentRentalsData, ...historyData, ...pendingData, ...returnRequestedData];
      if (allItems.length > 0) {
        fetchItemImages(allItems);
      }
  
      setRentalHistory(historyData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  // Update student ID and phone number in Firebase
  const updateProfileData = async () => {
    if (!user) return;
    
    try {
      const userProfileRef = doc(db, 'user_profiles', user.uid);
      await updateDoc(userProfileRef, {
        studentId: studentId,
        phoneNumber: phoneNumber,
        updatedAt: serverTimestamp()
      });
      
      alert('프로필 정보가 업데이트되었습니다.');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile data:', error);
      alert('프로필 정보 업데이트에 실패했습니다.');
    }
  };

  const fetchItemImages = (items) => {
    const urls = {};
  
    for (const item of items) {
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
  };
  
  
  

  // Handle file selection for agreement
  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setAgreementFile(e.target.files[0]);
    }
  };

  // Upload agreement file to Firebase
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
      },
      async () => {
        // Get download URL and update user profile
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        
        try {
          const userProfileRef = doc(db, 'user_profiles', user.uid);
          await updateDoc(userProfileRef, {
            agreementSubmitted: true,
            agreementUrl: downloadURL,
            agreementFilename: agreementFile.name,
            agreementUploadedAt: serverTimestamp()
          });
          
          setAgreementSubmitted(true);
          setIsUploading(false);
          setUploadProgress(0);
          alert('대여 서약서가 성공적으로 등록되었습니다.');
        } catch (error) {
          console.error('Error updating user profile:', error);
          setIsUploading(false);
        }
      }
    );
  };

  // Toggle expanded state for rental items
  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };
  
  // ✅ 여기 아래에 붙이세요
  const handleReturnImageUpload = async (e, reservationId) => {
    const file = e.target.files[0];
    if (!file || !reservationId) return;
  
    const compressedBlob = await compressImage(file, 800, 0.7);
  
    const storageRef = ref(storage, `returnImages/${reservationId}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, compressedBlob);

  
  
    uploadTask.on('state_changed',
      null,
      (error) => {
        console.error('이미지 업로드 실패:', error);
        alert('이미지 업로드에 실패했습니다.');
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        await updateDoc(doc(db, 'reservations', reservationId), {
          returnImageURL: downloadURL,
          returnImageUploadedAt: serverTimestamp(),
        });
  
        // ✅ 업로드 완료 상태 저장
        setUploadedReturnImages(prev => ({
          ...prev,
          [reservationId]: true
        }));
  
        alert('반납 사진이 성공적으로 업로드되었습니다.');
      }
    );
  };
  
  
  const compressImage = (file, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target.result;
    };

    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scaleFactor = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * scaleFactor;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Blob 생성 실패'));
      }, 'image/jpeg', quality);
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

  

  // Format date for readable display
  const formatDate = (dateString, timeString) => {
    if (!dateString) return 'N/A';
    const formattedDate = dateString;
    return timeString ? `${formattedDate} ${timeString}` : formattedDate;
  };

  // Render user info for header
  const renderUserInfo = () => {
    if (user) {
      return (
        <div style={{ 
          position: 'absolute',
          right: '230px',
          top: '0px',
          fontSize: '12x',
          color: 'black',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
         {/* <User size={16} />
          {user.name}님 */}
        </div>
      );
    }
    return null;
  };


  
  // Render a single rental item card
  const renderRentalItem = (item, isHistory = false) => {
    const isExpanded = expandedItems[item.id] || false;

    
    
    return (
      <div 
        key={item.id} 
        style={{
          border: '1px solid #E0E0E0',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px',
          backgroundColor: isHistory ? '#f9f9f9' : '#fff'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px',
          cursor: 'pointer'
        }}
        onClick={() => toggleExpand(item.id)}
        >
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: 'bold' 
          }}>
            {item.name}
          </h3>
          
          {isExpanded ? 
            <ChevronUp size={20} color="#666" /> : 
            <ChevronDown size={20} color="#666" />
          }
        </div>
        
        <div style={{ 
          display: 'flex',
          alignItems: isExpanded ? 'flex-start' : 'center'
        }}>
          {/* Item Image */}
<div style={{ 
  width: '100px', 
  height: '100px', 
  marginRight: '20px',
  backgroundColor: '#F5F5F5',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  flexShrink: 0
}}>
  {imageUrls[item.id] ? (
    <img 
      src={imageUrls[item.id]} 
      alt={item.name} 
      style={{ 
        width: '100%', 
        height: '100%', 
        objectFit: 'cover' 
      }} 
    />
  ) : (
    <div style={{ textAlign: 'center', color: '#999' }}>
      No Image
    </div>
  )}
</div>


          {/* Item Basic Info */}
          <div style={{ flex: 1 }}>
          {item.rentalCount !== undefined && (
  <p style={{ fontWeight: 'bold', marginBottom: '5px' }}>
   
  </p>
)}

📦 이 사용자의 {item.rentalCount}번째 대여입니다
            <p style={{ color: '#666' }}>
  {item.brand && `${item.brand} | `}
  {item.category}
  {item.condition && ` | ${item.condition}`}
</p>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              marginTop: '10px' 
            }}>
              <div style={{ marginBottom: '5px' }}>
                <span style={{ fontWeight: 'bold', marginRight: '10px' }}>대여 시작:</span>
                {formatKoreanDateTime(item.startDateTime)}
              </div>
              <div>
                <span style={{ fontWeight: 'bold', marginRight: '10px' }}>반납 예정:</span>
                {formatKoreanDateTime(item.endDateTime)}
              </div>
              
              {isHistory && (
  <div style={{
    marginTop: '5px',
    color:
      item.returnStatus === 'late' ? '#e53935' :
      item.returnStatus === 'damaged' ? '#ff9800' :
      '#4caf50'
  }}>
    <span style={{ fontWeight: 'bold', marginRight: '10px' }}>반납 상태:</span>
    {item.returnStatus === 'late' && '연체'}
    {item.returnStatus === 'damaged' && '벌점 부과'}
    {item.returnStatus === 'normal' && '정상 반납'}
  </div>
)}

            </div>
          </div>
        </div>
        
        {/* Extended information when expanded */}
        {isExpanded && (
  <div style={{
    marginTop: '15px',
    paddingTop: '15px',
    borderTop: '1px solid #e0e0e0'
  }}>
    <p><strong>예약 일시:</strong> {formatFullKoreanDateTime(item.approvedAt)}</p>
    {item.purpose && <p><strong>대여 목적:</strong> {item.purpose}</p>}
    {item.description && <p><strong>설명:</strong> {item.description}</p>}
    {item.notes && <p><strong>비고:</strong> {item.notes}</p>}

    {/* 장비 리스트 */}
    {item.items && item.items.length > 0 && (
      <div style={{ marginTop: '15px' }}>
        <h4 style={{ marginBottom: '10px', fontSize: '16px' }}>장비 리스트</h4>
        {item.items.map((equip, idx) => (
          <div key={idx} style={{ display: 'flex', marginBottom: '20px' }}>
            <div style={{ marginRight: '20px' }}>
              {equip.imageURL ? (
                <img 
                  src={equip.imageURL}
                  alt={equip.name}
                  style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '4px' }}
                />
              ) : (
                <div style={{ 
                  width: '100px', height: '100px',
                  backgroundColor: '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '4px'
                }}>
                  <span>이미지 없음</span>
                </div>
              )}
            </div>
            <div>
              <p><strong>장비 이름:</strong> {equip.name}</p>
              {equip.condition && <p><strong>상태:</strong> {equip.condition}</p>}
              {equip.category && <p><strong>분류:</strong> {equip.category}</p>}
            </div>
          </div>
        ))}
      </div>
    )}

{item.status === 'pending' && (
  <button
    onClick={() => cancelReservation(item.id)}
    style={{
      padding: '8px 12px',
      backgroundColor: '#ff5252',
      color: 'white',
      border: 'none',
      borderRadius: '5px',
      marginTop: '10px',
      cursor: 'pointer'
    }}
  >
    대여 신청 취소
  </button>
)}



            

{/* 기존 반납 상태 표시 */}
{item.status === 'returned' && item.returnStatus && (
        <div style={{ 
          padding: '8px 12px', 
          backgroundColor: item.returnStatus === 'late' ? '#ffebee' : '#e8f5e9',
          color: item.returnStatus === 'late' ? '#d32f2f' : '#2e7d32',
          borderRadius: '5px'
        }}>
          <strong>반납 상태:</strong> {item.returnStatus === 'late' ? '연체' : '정상 반납'}
        </div>
      )}

      

            
{/* 렌탈 카드 내 버튼 표시 조건 */}
{item.status === 'active' && (
  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
    
    {/* ✅ 이미지 업로드 먼저 */}
    <label style={{
      padding: '8px 12px',
      backgroundColor: '#e0e0e0',
      color: '#333',
      borderRadius: '5px',
      cursor: 'pointer',
      display: 'inline-block'
    }}>
      반납 사진 업로드
      <input 
        type="file" 
        accept="image/*"
        onChange={(e) => handleReturnImageUpload(e, item.id)} 
        style={{ display: 'none' }}
      />
    </label>

    {/* ✅ 반납 요청 버튼: 이미지 업로드 전엔 비활성화 */}
    <button
      onClick={() => handleReturnRequest(item.id)}
      disabled={!uploadedReturnImages[item.id]}
      style={{
        padding: '8px 12px',
        backgroundColor: uploadedReturnImages[item.id] ? '#4285f4' : '#cccccc',
        color: '#fff',
        border: 'none',
        borderRadius: '5px',
        cursor: uploadedReturnImages[item.id] ? 'pointer' : 'not-allowed'
      }}
    >
      반납 요청
    </button>
  </div>
)}



            {isHistory && item.returnStatus === 'late' && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                backgroundColor: '#ffebee',
                borderRadius: '4px'
              }}>
                <p style={{ color: '#c62828', fontWeight: 'bold' }}>
                  <AlertTriangle size={16} style={{ marginRight: '5px', verticalAlign: 'middle' }} />
                  연체 정보: {item.lateDays || 0}일 연체
                </p>
                {Number(item.penaltyPoints) > 0 && (
  <p style={{ color: '#c62828' }}>
    부과된 벌점: {item.penaltyPoints}점
  </p>
)}


              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{
      position: 'relative',
      width: '1440px',
      height: '100%',
      minHeight: '1000px',
      background: '#FFFFFF',
      margin: '0 auto',
      fontFamily: 'Pretendard, sans-serif',
      color: '#000000',
      paddingBottom: '180px',
      overflow: 'auto'
    }}>
      {/* Header Section - Same as CartPage */}
      <div style={{
        position: 'sticky',
        top: '20px',
        left: '20px',
        right: '20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '0px solid #5F5F5F',
        paddingBottom: '45px',
        
      }}>
        {renderUserInfo()}
      </div>

      {/* Navigation and Logo Area - Same as CartPage */}
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
          <span onClick={handleHomeNavigation} style={{ cursor: 'pointer' }}>Home</span>
          <span onClick={handleCalendarNavigation} style={{ cursor: 'pointer' }}>Calendar</span>
          <span onClick={handleReservateNavigation} style={{ cursor: 'pointer' }}>Reservation</span>
          <span onClick={handleNoteNavigation} style={{ cursor: 'pointer' }}>Note</span>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div onClick={handleHomeNavigation}  style={{ 
            position: 'absolute',
            fontSize: '36px', 
            fontWeight: 'bold', 
            letterSpacing: '0px',
            top: '0px',
            left: '70px',
            cursor : 'pointer'
            
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
            backgroundColor: '#cccccc'
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
            backgroundColor: '#f0f0f0',
          }}
            onClick = {handleCartNavigation}
          >
            <ShoppingCart size={20} />
            <span>Cart</span>
          </div>
        </div>
      </div>

      {/* MyPage Content Area */}
      <div style={{
        position: 'absolute',
        top: '150px',
        left: '50px',
        right: '50px'
      }}>
        <h2 style={{ 
          fontSize: '24px', 
          fontWeight: 'bold', 
          marginBottom: '20px', 
          marginLeft: '40px'
        }}>
          마이페이지
        </h2>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>로딩 중...</div>
        ) : !user ? (
          <div style={{ 
            textAlign: 'center', 
            color: '#888',
            padding: '50px' 
          }}>
            로그인이 필요합니다.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '30px' }}>
            {/* Left sidebar for user profile and stats */}
            <div style={{ width: '300px' }}>
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
                    <h3 style={{ fontWeight: 'bold', fontSize: '18px' }}>{user.name}</h3>
                    <p style={{ color: '#666', fontSize: '14px' }}>{user.email}</p>
                  </div>
                </div>

                {/* Student ID and Phone Number Fields */}
                <div style={{ marginBottom: '20px', borderBottom: '1px solid #e0e0e0', paddingBottom: '15px' }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '10px' 
                  }}>
                    <h4 style={{ fontSize: '16px', fontWeight: 'bold' }}>프로필 정보</h4>
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
                        placeholder="학번을 입력하세요"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    ) : (
                      <p style={{ fontSize: '14px' }}>{studentId || '미입력'}</p>
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
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="전화번호를 입력하세요"
                        style={{
                          width: '100%',
                          padding: '8px',
                          border: '1px solid #ddd',
                          borderRadius: '4px'
                        }}
                      />
                    ) : (
                      <p style={{ fontSize: '14px' }}>{phoneNumber || '미입력'}</p>
                    )}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>현재 대여 장비</span>
                    <span style={{ fontWeight: 'bold' }}>{currentRentals.length}개</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span>대여 이력</span>
                    <span style={{ fontWeight: 'bold' }}>{rentalHistory.length}건</span>
                  </div>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    marginBottom: '10px',
                    color: penaltyPoints > 0 ? '#e53935' : 'inherit'
                  }}>
                    <span>누적 벌점</span>
                    <span style={{ fontWeight: 'bold' }}>{penaltyPoints}점</span>
                  </div>
                </div>
              </div>

              {/* Agreement upload section */}
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
    alignItems: 'center'
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

  {agreementSubmitted && (
    <p style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
      잘못 등록하셨나요?
    </p>
  )}

<input 
  type="file" 
  onChange={handleFileChange}
  style={{ marginBottom: '10px', width: '100%' }}
  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.bmp,.gif,.webp,.heic"
/>

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

  <button 
    onClick={uploadAgreement}
    disabled={!agreementFile || isUploading}
    style={{
      width: '100%',
      padding: '10px',
      backgroundColor: agreementFile && !isUploading ? '#4caf50' : '#e0e0e0',
      color: agreementFile && !isUploading ? 'white' : '#666',
      border: 'none',
      borderRadius: '5px',
      cursor: agreementFile && !isUploading ? 'pointer' : 'not-allowed'
    }}
  >
    {agreementSubmitted ? '서약서 다시 등록하기' : '서약서 등록하기'}
  </button>
</div>

            </div>

            {/* Main content area */}
            <div style={{ flex: 1 }}>
              {/* Tab navigation */}
              <div style={{ 
                display: 'flex', 
                borderBottom: '1px solid #e0e0e0',
                marginBottom: '20px'
              }}>
                <div 
                  style={{ 
                    padding: '10px 20px',
                    fontWeight: activeTab === 'current' ? 'bold' : 'normal',
                    borderBottom: activeTab === 'current' ? '2px solid #000' : 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveTab('current')}
                >
                  현재 대여 장비
                </div>


                <div 
                  style={{ 
                    padding: '10px 20px',
                    fontWeight: activeTab === 'pending' ? 'bold' : 'normal',
                    borderBottom: activeTab === 'pending' ? '2px solid #000' : 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveTab('pending')}
                >
                  대여 신청 중
                </div>



                <div 
                  style={{ 
                    padding: '10px 20px',
                    fontWeight: activeTab === 'returning' ? 'bold' : 'normal',
                    borderBottom: activeTab === 'returning' ? '2px solid #000' : 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveTab('returning')}
                >
                  반납 요청 중
                </div>




                <div 
                  style={{ 
                    padding: '10px 20px',
                    fontWeight: activeTab === 'history' ? 'bold' : 'normal',
                    borderBottom: activeTab === 'history' ? '2px solid #000' : 'none',
                    cursor: 'pointer'
                  }}
                  onClick={() => setActiveTab('history')}
                >
                  대여 이력
                </div>



              </div>

              {/* Current rentals tab */}
              {activeTab === 'current' && (
                <div>
                  {currentRentals.length === 0 ? (
                    <div style={{ 
                      padding: '30px', 
                      textAlign: 'center',
                      color: '#666',
                      backgroundColor: '#f5f5f5',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '8px'
                    }}>
                      현재 대여 중인 장비가 없습니다.
                    </div>
                  ) : (
                    <div>
                      {currentRentals.map(item => renderRentalItem(item))}
                    </div>
                  )}
                </div>
              )}

{activeTab === 'pending' && (
  <div>
    {pendingRentals.length === 0 ? (
      <div>대여 신청 중인 장비가 없습니다.</div>
    ) : (
      pendingRentals.map(item => (
        <div key={item.id}>
          {renderRentalItem(item)}

        </div>
      ))
    )}
  </div>
)}

{activeTab === 'returning' && (
  <div>
    {returnRequestedRentals.length === 0 ? (
      <div>반납 요청 중인 장비가 없습니다.</div>
    ) : (
      returnRequestedRentals.map(item => (
        <div key={item.id}>
          {renderRentalItem(item)}
         
        </div>
      ))
    )}
  </div>
)}



              {/* Rental history tab */}
              {activeTab === 'history' && (
                <div>
                  {rentalHistory.length === 0 ? (
                    <div style={{ 
                      padding: '30px', 
                      textAlign: 'center',
                      color: '#666',
                      backgroundColor: '#f5f5f5',
                      borderRadius: '8px'
                    }}>
                      대여 이력이 없습니다.
                    </div>
                  ) : (
                    <div>
                      {rentalHistory.map(item => renderRentalItem(item, true))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    
  );
};

export default MyPage;