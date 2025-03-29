import React, { useState, useEffect } from 'react';
import { User, ShoppingCart, Clock, FileText, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
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
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      
      // Fetch user data
      fetchUserData(parsedUser.uid);
    } else {
      console.log('No user found in localStorage');
      setLoading(false);
    }
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
      } else {
        // Create profile if it doesn't exist
        await updateDoc(userProfileRef, {
          penaltyPoints: 0,
          agreementSubmitted: false,
          createdAt: serverTimestamp()
        });
      }
      
      // Fetch current rentals
      const currentRentalsRef = collection(db, 'rentals');
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
      
      // Fetch rental history
      const historyRef = collection(db, 'rentals');
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
      setRentalHistory(historyData);
      
      // Combine all items for image fetching
      const allItems = [...currentRentalsData, ...historyData];
      if (allItems.length > 0) {
        fetchItemImages(allItems);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setLoading(false);
    }
  };

  // Fetch images for all items
  const fetchItemImages = async (items) => {
    const urls = {};
    for (const item of items) {
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
          right: '200px',
          top: '0px',
          fontSize: '14px',
          color: 'green',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <User size={16} />
          {user.name}님
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
              {item.category} | {item.condition || '상태 정보 없음'}
            </p>
            
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column',
              marginTop: '10px' 
            }}>
              <div style={{ marginBottom: '5px' }}>
                <span style={{ fontWeight: 'bold', marginRight: '10px' }}>대여 시작:</span>
                {formatDate(item.rentalDate, item.rentalTime)}
              </div>
              <div>
                <span style={{ fontWeight: 'bold', marginRight: '10px' }}>반납 예정:</span>
                {formatDate(item.returnDate, item.returnTime)}
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
            <p><strong>장비 ID:</strong> {item.equipmentId || 'ID 정보 없음'}</p>
            <p><strong>예약 일시:</strong> {formatDate(item.reservationDate, item.reservationTime) || '정보 없음'}</p>
            {item.notes && <p><strong>비고:</strong> {item.notes}</p>}
            
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
      height: 'auto',
      minHeight: '1000px',
      background: '#FFFFFF',
      margin: '0 auto',
      fontFamily: 'Pretendard, sans-serif',
      color: '#000000',
      paddingBottom: '80px'
    }}>
      {/* Header Section - Same as CartPage */}
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
          <div style={{ 
            position: 'absolute',
            fontSize: '36px', 
            fontWeight: 'bold', 
            letterSpacing: '0px',
            top: '0px',
            left: '70px'
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
            backgroundColor: '#f0f0f0'
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
            onClick: handleCartNavigation
          }}>
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

                <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '15px' }}>
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
                      borderRadius: '8px'
                    }}>
                      <Clock size={40} style={{ margin: '0 auto 15px', color: '#999' }} />
                      <p>현재 대여 중인 장비가 없습니다.</p>
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
                      <FileText size={40} style={{ margin: '0 auto 15px', color: '#999' }} />
                      <p>대여 이력이 없습니다.</p>
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