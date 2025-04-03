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
  const [penaltyPoints, setPenaltyPoints] = useState(0);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState({});
  const [activeTab, setActiveTab] = useState('current');
  const [expandedItems, setExpandedItems] = useState({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

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
      // Fetch user profile including penalties and agreement status
      const userProfileRef = doc(db, 'user_profiles', userId);
      const userProfileDoc = await getDoc(userProfileRef);
      
      if (userProfileDoc.exists()) {
        const profileData = userProfileDoc.data();
        setPenaltyPoints(profileData.penaltyPoints || 0);
        setAgreementSubmitted(profileData.agreementSubmitted || false);
        setStudentId(profileData.studentId || '');
        setPhoneNumber(profileData.phoneNumber || '');
      } else {
        // Create profile if it doesn't exist
        await updateDoc(userProfileRef, {
          penaltyPoints: 0,
          agreementSubmitted: false,
          studentId: '',
          phoneNumber: '',
          createdAt: serverTimestamp()
        });
      }
      
      // Fetch current rentals
      const currentRentalsRef = collection(db, 'reservations');
      const currentRentalsQuery = query(
        currentRentalsRef, 
        where('userId', '==', userId),
        where('status', '==', 'active')
      );
      
      const currentRentalsSnapshot = await getDocs(currentRentalsQuery);
      const currentRentalsData = currentRentalsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));


      setCurrentRentals(currentRentalsData);
      
// 기존 currentRentalsData와 reservationsData를 합쳐서 중복 제거
const allUniqueRentals = [...currentRentalsData, ...reservationsData].filter(
  (item, index, self) =>
    index === self.findIndex((t) => t.id === item.id)
);
setCurrentRentals(allUniqueRentals);

      
      // Fetch rental history
      const historyRef = collection(db, 'reservations');
      const historyQuery = query(
        historyRef, 
        where('userId', '==', userId),
        where('status', '==', 'returned')
      );
      
      const historySnapshot = await getDocs(historyQuery);
      const historyData = historySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const groupedRentalHistory = {};
rentalHistory.forEach(item => {
  const start = item.rentalDate || item.startDateTime?.split('T')[0];
  const end = item.returnDate || item.endDateTime?.split('T')[0];
  const key = `${start} ~ ${end}`;

  if (!groupedRentalHistory[key]) {
    groupedRentalHistory[key] = [];
  }
  groupedRentalHistory[key].push(item);
});





const flatHistoryItems = Object.values(groupedHistory).flat();
await fetchItemImages(flatHistoryItems);

// 그룹화된 데이터 저장
setRentalHistory(groupedHistory);


// Fetch reservation-based return history
const reservationHistoryRef = collection(db, 'reservations');
const reservationHistoryQuery = query(
  reservationHistoryRef,
  where('userId', '==', userId),
  where('status', '==', 'returned')
);

const reservationHistorySnapshot = await getDocs(reservationHistoryQuery);
const reservationHistoryData = reservationHistorySnapshot.docs.flatMap(doc => {
  const data = doc.data();
  
  return (data.items || []).map(subItem => ({
    ...subItem,
    parentId: doc.id,
    status: data.status,
    returnDate: data.returnDate,
    returnStatus: data.returnStatus,
    penaltyPoints: data.penaltyPoints,
    reservationDate: data.reservationDate,
    reservationTime: data.reservationTime,
    createdAt: data.createdAt
  }));
});

// rentalHistory를 rentals + reservations 이력으로 합치기
setRentalHistory([...historyData, ...reservationHistoryData]);
      







     // Fetch active reservations that should be shown in current rentals
const reservationsRef = collection(db, 'reservations');
const reservationsQuery = query(
  reservationsRef,
  where('userId', '==', userId),
  where('status', '==', 'active')
);

const reservationsSnapshot = await getDocs(reservationsQuery);
const reservationsData = await Promise.all(
  reservationsSnapshot.docs.map(async (doc) => {
    const data = doc.data();
    const rentalCount = await getUserRentalCount(data.userId); // 대여 횟수 가져오기
    return {
      id: doc.id,
      ...data,
      rentalCount,
    };
  })
);
      
      // Add current active reservations to current rentals
      setCurrentRentals(prevRentals => [...prevRentals, ...reservationsData]);
      
      // Combine all items for image fetching
      const allItems = [...currentRentalsData, ...historyData, ...reservationsData];
if (allItems.length > 0) {
  fetchItemImages(allItems);
}

      
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

  // Fetch images for all items
  const fetchItemImages = async (items) => {
    const urls = {};
  
    for (const item of items) {
      // 예약 데이터인 경우, item.items 배열이 존재함
      if (item.items && Array.isArray(item.items)) {
        for (const subItem of item.items) {
          console.log("렌탈 항목 image 확인:", subItem.name, subItem.image);
          if (subItem.image) {
            try {
              const url = await getImageURL(subItem.image);
              urls[subItem.id] = url;
            } catch (error) {
              console.error(`Error loading image for ${subItem.name}:`, error);
              urls[subItem.id] = null;
            }
          }
        }
      } else {
        // 일반 rental 문서 (name, image 바로 있음)
        console.log("렌탈 항목 image 확인:", item.name, item.image);
        if (item.image) {
          try {
            const url = await getImageURL(item.image);
            urls[item.id] = url;
          } catch (error) {
            console.error(`Error loading image for ${item.name}:`, error);
            urls[item.id] = null;
          }
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
            <p style={{ color: '#666' }}>
              {item.brand && `${item.brand} | `}
              {item.category || ''} | {item.condition || '상태 정보 없음'}
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
                <div style={{ marginTop: '5px', color: item.returnStatus === 'late' ? '#e53935' : '#4caf50' }}>
                  <span style={{ fontWeight: 'bold', marginRight: '10px' }}>반납 상태:</span>
                  {item.returnStatus === 'late' ? '연체' : '정상 반납'}
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
              style={{ width: '160px', height: '160px', objectFit: 'cover', borderRadius: '4px' }}
            />
          ) : (
            <div style={{ 
              width: '160px', height: '160px',
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
            
{/* 렌탈 카드 내 버튼 표시 조건 */}
{item.status === 'active' && (
  <button
    onClick={() => handleReturnRequest(item.id)}
    style={{
      marginTop: '10px',
      padding: '8px 12px',
      backgroundColor: '#4285f4',
      color: '#fff',
      border: 'none',
      borderRadius: '5px',
      cursor: 'pointer'
    }}
  >
    반납 요청
  </button>
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
                {item.penaltyPoints > 0 && (
                  <p style={{ color: '#c62828' }}>부과된 벌점: {item.penaltyPoints}점</p>
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

                {agreementSubmitted ? (
                  <div style={{
                    backgroundColor: '#e8f5e9',
                    color: '#2e7d32',
                    padding: '10px',
                    borderRadius: '5px',
                    marginTop: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <CheckCircle size={16} style={{ marginRight: '8px' }} />
                    서약서가 등록되었습니다
                  </div>
                ) : (
                  <div>
                    <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
                      장비 대여를 위해 서약서를 등록해주세요. 한 번만 등록하면 됩니다.
                    </p>
                    
                    <input 
                      type="file" 
                      onChange={handleFileChange}
                      style={{ marginBottom: '15px', width: '100%' }}
                      accept=".pdf,.doc,.docx"
                    />
                    
                    {isUploading && (
                      <div style={{ marginBottom: '15px' }}>
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
                      서약서 등록하기
                    </button>
                  </div>
                )}
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