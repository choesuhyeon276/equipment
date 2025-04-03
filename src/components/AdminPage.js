import React, { useState, useEffect } from 'react';
import { 
  User, ShoppingCart, Clock, FileText, AlertTriangle, 
  ChevronDown, ChevronUp, Check, X, Award, RefreshCw 
} from 'lucide-react';
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
  writeBatch,
  orderBy
} from '../firebase/firebaseConfig';


import { Home, Calendar } from 'lucide-react';

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


const AdminPage = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [pendingRentals, setPendingRentals] = useState([]);
  const [activeRentals, setActiveRentals] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imageUrls, setImageUrls] = useState({});
  const [activeTab, setActiveTab] = useState('pending');
  const [expandedItems, setExpandedItems] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [penaltyPoints, setPenaltyPoints] = useState(0);
  const [penaltyReason, setPenaltyReason] = useState('');
  const [sortBy, setSortBy] = useState('userName'); // Default sort by user name

  // 선택된 대여 항목 일괄 승인
  const approveSelectedRentals = async () => {
    if (selectedItems.length === 0) {
      alert('선택된 항목이 없습니다.');
      return;
    }

    if (!confirm(`선택한 ${selectedItems.length}개 항목을 승인하시겠습니까?`)) return;

    try {
      const batch = writeBatch(db);

      for (const rentalId of selectedItems) {
        const rentalRef = doc(db, 'reservations', rentalId);
        batch.update(rentalRef, {
          status: 'active',
          approvedAt: serverTimestamp(),
          approvedBy: admin.uid,
        });
      }

      await batch.commit();

      // Update equipment status for each approved rental
      for (const rentalId of selectedItems) {
        const rentalRef = doc(db, 'reservations', rentalId);
        const rentalDoc = await getDoc(rentalRef);
        const rentalData = rentalDoc.data();
        
        if (rentalData.equipmentId) {
          const equipmentRef = doc(db, 'cameras', rentalData.equipmentId);
          await updateDoc(equipmentRef, {
            status: 'rented',
            lastRentalId: rentalId
          });
        }
      }

      alert(`${selectedItems.length}개 항목이 승인되었습니다.`);
      setSelectedItems([]);
      fetchRentalData();
    } catch (error) {
      console.error('Error approving rentals:', error);
      alert('일괄 승인 중 오류가 발생했습니다.');
    }
  };

  // 선택된 대여 항목 일괄 거절
  const rejectSelectedRentals = async () => {
    if (selectedItems.length === 0) {
      alert('선택된 항목이 없습니다.');
      return;
    }

    if (!confirm(`선택한 ${selectedItems.length}개 항목을 거절하시겠습니까?`)) return;

    try {
      const batch = writeBatch(db);

      for (const rentalId of selectedItems) {
        const rentalRef = doc(db, 'reservations', rentalId);
        batch.update(rentalRef, {
          status: 'rejected',
          rejectedAt: serverTimestamp(),
          rejectedBy: admin.uid,
        });
      }

      await batch.commit();

      alert(`${selectedItems.length}개 항목이 거절되었습니다.`);
      setSelectedItems([]);
      fetchRentalData();
    } catch (error) {
      console.error('Error rejecting rentals:', error);
      alert('일괄 거절 중 오류가 발생했습니다.');
    }
  };

  // 내비게이션 핸들러
  const handleHomeNavigation = () => {
    navigate('/main');
  };

  const handleCalendarNavigation = () => {
    navigate('/calendar');
  };

  const handleNoteNavigation = () => {
    navigate('/thingsnote');
  };

  const handleReservateNavigation = () => {
    navigate('/ReservationMainPage');
  };

  // Page load - authentication and data fetching
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      if (firebaseUser) {
        // 관리자 권한 확인
        checkAdminRole(firebaseUser.uid).then(isAdmin => {
          if (isAdmin) {
            const adminData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              name: firebaseUser.displayName || '관리자'
            };
            
            setAdmin(adminData);
            fetchRentalData();
          } else {
            // 관리자가 아닌 경우 메인 페이지로 리디렉션
            alert('관리자 권한이 없습니다.');
            navigate('/main');
          }
        });
      } else {
        console.log('Firebase 인증된 유저 없음');
        setAdmin(null);
        setLoading(false);
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, []);

  // 관리자 권한 체크
  const checkAdminRole = async (userId) => {
    try {
      const userRef = doc(db, 'user_profiles', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data().role === 'admin';
      }
      return false;
    } catch (error) {
      console.error('Error checking admin role:', error);
      return false;
    }
  };

  // 대여 데이터 불러오기
  const fetchRentalData = async () => {
    try {
      const pendingQuery = query(
        collection(db, 'reservations'),
        where('status', '==', 'pending')
      );
      const pendingSnapshot = await getDocs(pendingQuery);
      const pendingData = pendingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('Pending data:', pendingData);
      
      // 유저 정보 추가 로드 (필요한 경우)
      const enhancedPendingData = await Promise.all(pendingData.map(async (rental) => {
        if (rental.userId && !rental.userName) {
          try {
            const userRef = doc(db, 'user_profiles', rental.userId);
            const userDoc = await getDoc(userRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              return {
                ...rental,
                userName: userData.name || userData.displayName || '이름 없음',
                userEmail: userData.email || rental.userEmail || '이메일 없음'
              };
            }
          } catch (error) {
            console.error('Error fetching user data:', error); // ✅ 이제 error 정의됨
          }
        }

        return rental;
      }));
      
      // 정렬 적용
      const sortedPendingData = sortRentalData(enhancedPendingData, sortBy);
      setPendingRentals(sortedPendingData);
      
      // 2. 현재 대여 중인 장비 목록
      const activeQuery = query(
        collection(db, 'reservations'),
        where('status', '==', 'active')
      );
      
      const activeSnapshot = await getDocs(activeQuery);
      const activeData = activeSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setActiveRentals(activeData);
      
      // 3. 반납 요청 목록
      const returnQuery = query(
        collection(db, 'reservations'),
        where('status', '==', 'return_requested')
      );
      
      const returnSnapshot = await getDocs(returnQuery);
      const returnData = returnSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReturnRequests(returnData);
      
      // 모든 아이템 이미지 로드
      const allItems = [...enhancedPendingData, ...activeData, ...returnData];

      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching rental data:', error);
      setLoading(false);
    }
  };

  // 데이터 정렬 함수
  const sortRentalData = (data, sortKey) => {
    return [...data].sort((a, b) => {
      switch (sortKey) {
        case 'userName':
          return (a.userName || '').localeCompare(b.userName || '');
        case 'rentalDate':
          return new Date(a.startDateTime || a.rentalDate || 0) - new Date(b.startDateTime || b.rentalDate || 0);
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'userId':
          return (a.userId || '').localeCompare(b.userId || '');
        default:
          return 0;
      }
    });
  };

  // 정렬 변경 처리
  const handleSortChange = (key) => {
    setSortBy(key);
    
    // 현재 탭에 따라 다른 상태 업데이트
    if (activeTab === 'pending') {
      setPendingRentals(sortRentalData(pendingRentals, key));
    } else if (activeTab === 'active') {
      setActiveRentals(sortRentalData(activeRentals, key));
    } else if (activeTab === 'return') {
      setReturnRequests(sortRentalData(returnRequests, key));
    }
  };

  

  // 선택된 아이템 토글
  const toggleSelectItem = (itemId) => {
    setSelectedItems(prev => {
      if (prev.includes(itemId)) {
        return prev.filter(id => id !== itemId);
      } else {
        return [...prev, itemId];
      }
    });
  };

  

  // 모든 아이템 선택/해제
  const toggleSelectAll = (items) => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  // 대여 신청 승인
const approveRental = async (rentalId) => {
  try {
    // 1. Firebase 상태 업데이트
    const rentalRef = doc(db, 'reservations', rentalId);
    await updateDoc(rentalRef, {
      status: 'active',
      approvedAt: serverTimestamp(),
      approvedBy: admin.uid
    });

    // 2. 장비 상태를 'rented'로 변경
    const rentalDoc = await getDoc(rentalRef);
    const rentalData = rentalDoc.data();

    if (rentalData.equipmentId) {
      const equipmentRef = doc(db, 'cameras', rentalData.equipmentId);
      await updateDoc(equipmentRef, {
        status: 'rented',
        lastRentalId: rentalId
      });
    }

    // 3. 서버에 Google Calendar 등록 요청
    const response = await fetch('/api/addEventToCalendar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: `[장비 대여 승인] ${rentalData.name}`,
        description: `사용자: ${rentalData.userName || rentalData.userId}\n사용 목적: ${rentalData.purpose || '없음'}`,
        startDate: rentalData.rentalDate,
        startTime: rentalData.rentalTime,
        endDate: rentalData.returnDate,
        endTime: rentalData.returnTime
      })
    });

    if (!response.ok) {
      throw new Error('캘린더 등록 실패');
    }

    alert('대여 신청이 승인되었고, 일정이 캘린더에 등록되었습니다.');
    fetchRentalData();
  } catch (error) {
    console.error('Error approving rental:', error);
    alert('승인 처리 중 오류가 발생했습니다.');
  }
};



  // 대여 신청 거절 (Missing function implementation)
  const rejectRental = async (rentalId) => {
    try {
      const rentalRef = doc(db, 'reservations', rentalId);
      await updateDoc(rentalRef, {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: admin.uid
      });

      alert('대여 신청이 거절되었습니다.');
      fetchRentalData();
    } catch (error) {
      console.error('Error rejecting rental:', error);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  // 반납 처리 (Missing function implementation)
  const processReturn = async (rentalId) => {
    try {
      // Get rental data first
      const rentalRef = doc(db, 'reservations', rentalId);
      const rentalDoc = await getDoc(rentalRef);
      const rentalData = rentalDoc.data();
      
      // Ask if there are any damages
      const hasIssues = confirm('반납된 장비에 문제가 있습니까? (확인: 예, 취소: 아니오)');
      
      if (hasIssues) {
        // Open penalty modal if there are issues
        setCurrentUser({
          id: rentalData.userId,
          name: rentalData.userName || '사용자',
          rentalId: rentalId
        });
        setPenaltyModalOpen(true);
      } else {
        // Normal return process
        await updateDoc(rentalRef, {
          status: 'returned',
          returnedAt: serverTimestamp(),
          processedBy: admin.uid,
          returnStatus: 'normal'
        });
        
        // Update equipment status
        if (rentalData.equipmentId) {
          const equipmentRef = doc(db, 'cameras', rentalData.equipmentId);
          await updateDoc(equipmentRef, {
            status: 'available',
            lastRentalId: null
          });
        }
        
        alert('반납 처리가 완료되었습니다.');
        fetchRentalData();
      }
    } catch (error) {
      console.error('Error processing return:', error);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  // 벌점 부과 및 반납 처리
  const applyPenaltyAndProcessReturn = async () => {
    if (!currentUser || penaltyPoints <= 0 || !penaltyReason) {
      alert('벌점 정보를 모두 입력해주세요.');
      return;
    }
    
    try {
      // 1. 대여 상태 업데이트
      const rentalRef = doc(db, 'reservations', currentUser.rentalId);
      await updateDoc(rentalRef, {
        status: 'returned',
        returnedAt: serverTimestamp(),
        processedBy: admin.uid,
        returnStatus: 'damaged',
        penaltyPoints: penaltyPoints,
        penaltyReason: penaltyReason
      });
      
      // 2. 사용자 프로필에 벌점 추가
      const userRef = doc(db, 'user_profiles', currentUser.id);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const currentPenalty = userDoc.data().penaltyPoints || 0;
        await updateDoc(userRef, {
          penaltyPoints: currentPenalty + penaltyPoints,
          penaltyHistory: [
            ...(userDoc.data().penaltyHistory || []),
            {
              points: penaltyPoints,
              reason: penaltyReason,
              date: serverTimestamp(),
              rentalId: currentUser.rentalId,
              adminId: admin.uid
            }
          ]
        });
      }
      
      // 3. 장비 상태 업데이트
      const rentalDoc = await getDoc(rentalRef);
      const equipmentId = rentalDoc.data().equipmentId;
      
      if (equipmentId) {
        const equipmentRef = doc(db, 'cameras', equipmentId);
        const equipmentDoc = await getDoc(equipmentRef);
        
        if (equipmentDoc.exists()) {
          await updateDoc(equipmentRef, {
            status: 'available',
            lastRentalId: null,
            damageHistory: [
              ...(equipmentDoc.data().damageHistory || []),
              {
                date: serverTimestamp(),
                description: penaltyReason,
                rentalId: currentUser.rentalId,
                userId: currentUser.id
              }
            ]
          });
        }
      }
      
      alert(`반납 처리 및 ${penaltyPoints}점의 벌점이 부과되었습니다.`);
      setPenaltyModalOpen(false);
      setPenaltyPoints(0);
      setPenaltyReason('');
      setCurrentUser(null);
      fetchRentalData();
    } catch (error) {
      console.error('Error applying penalty:', error);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  // 일괄 반납 처리
  const processSelectedReturns = async () => {
    if (selectedItems.length === 0) {
      alert('선택된 항목이 없습니다.');
      return;
    }
    
    if (!confirm(`선택한 ${selectedItems.length}개 항목을 정상 반납 처리하시겠습니까?`)) return;
    
    try {
      const batch = writeBatch(db);
      
      for (const rentalId of selectedItems) {
        const rentalRef = doc(db, 'reservations', rentalId);
        batch.update(rentalRef, {
          status: 'returned',
          returnedAt: serverTimestamp(),
          processedBy: admin.uid,
          returnStatus: 'normal'
        });
      }
      
      await batch.commit();
      
      // 장비 상태 업데이트
      for (const rentalId of selectedItems) {
        const rentalRef = doc(db, 'reservations', rentalId);
        const rentalDoc = await getDoc(rentalRef);
        const equipmentId = rentalDoc.data().equipmentId;
        
        if (equipmentId) {
          const equipmentRef = doc(db, 'cameras', equipmentId);
          await updateDoc(equipmentRef, {
            status: 'available',
            lastRentalId: null
          });
        }
      }
      
      alert(`${selectedItems.length}개 항목이 반납 처리되었습니다.`);
      setSelectedItems([]);
      fetchRentalData();
    } catch (error) {
      console.error('Error batch processing returns:', error);
      alert('일괄 처리 중 오류가 발생했습니다.');
    }
  };

  // 항목 확장 토글
  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // 날짜 포맷팅
  const formatDate = (dateString, timeString) => {
    if (!dateString) return 'N/A';
    const formattedDate = dateString;
    return timeString ? `${formattedDate} ${timeString}` : formattedDate;
  };

  // 벌점 모달
  const renderPenaltyModal = () => {
    if (!penaltyModalOpen) return null;
    
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '30px',
          borderRadius: '10px',
          width: '500px'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px' }}>벌점 부과</h3>
          <p><strong>사용자:</strong> {currentUser?.name}</p>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>벌점 (1-10점):</label>
            <input 
              type="number" 
              min="1"
              max="10"
              value={penaltyPoints} 
              onChange={(e) => setPenaltyPoints(parseInt(e.target.value))}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px'
              }}
            />
          </div>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>사유:</label>
            <textarea 
              value={penaltyReason} 
              onChange={(e) => setPenaltyReason(e.target.value)}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                minHeight: '100px'
              }}
              placeholder="벌점 부과 사유를 자세히 입력해주세요."
            />
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button 
              onClick={() => setPenaltyModalOpen(false)}
              style={{
                padding: '8px 15px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: '#f5f5f5'
              }}
            >
              취소
            </button>
            <button 
              onClick={applyPenaltyAndProcessReturn}
              style={{
                padding: '8px 15px',
                backgroundColor: '#e53935',
                color: 'white',
                border: 'none',
                borderRadius: '4px'
              }}
            >
              벌점 부과 및 반납 처리
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 정렬 컨트롤 렌더링
  const renderSortControls = () => {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center',
        marginBottom: '15px',
        padding: '10px',
        backgroundColor: '#f5f5f5',
        borderRadius: '4px'
      }}>
        <span style={{ marginRight: '15px', fontWeight: 'bold', color:'#000000' }}>정렬:</span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={() => handleSortChange('userName')}
            style={{
              padding: '5px 10px',
              backgroundColor: sortBy === 'userName' ? '#2196F3' : '#E0E0E0',
              color: sortBy === 'userName' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            이름순
          </button>
          <button 
            onClick={() => handleSortChange('userId')}
            style={{
              padding: '5px 10px',
              backgroundColor: sortBy === 'userId' ? '#2196F3' : '#E0E0E0',
              color: sortBy === 'userId' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            사용자ID순
          </button>
          <button 
            onClick={() => handleSortChange('rentalDate')}
            style={{
              padding: '5px 10px',
              backgroundColor: sortBy === 'rentalDate' ? '#2196F3' : '#E0E0E0',
              color: sortBy === 'rentalDate' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            날짜순
          </button>
          <button 
            onClick={() => handleSortChange('name')}
            style={{
              padding: '5px 10px',
              backgroundColor: sortBy === 'name' ? '#2196F3' : '#E0E0E0',
              color: sortBy === 'name' ? 'white' : 'black',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            장비순
          </button>
        </div>
      </div>
    );
  };

  // 대여 아이템 렌더링
  const renderRentalItem = (item, type) => {
    console.log("렌더링되는 item:", item); // 여기!
    console.log("items 배열 내부:", item.items);
    const isExpanded = expandedItems[item.id] || false;
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <div 
        key={item.id} 
        style={{
          border: '1px solid #E0E0E0',
          borderRadius: '8px',
          padding: '15px',
          marginBottom: '15px',
          backgroundColor: isSelected ? '#f0f7ff' : '#fff'
        }}
      >
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <input 
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelectItem(item.id)}
              style={{ marginRight: '10px' }}
            />
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: 'bold',
              cursor: 'pointer',
              margin: 0,
              color: '#000000'
            }}
            onClick={() => toggleExpand(item.id)}
            >
              {item.userName || '신청자'} - 장비 {item.items?.length || 0}개

            </h3>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {type === 'pending' && (
              <>
                <button 
                  onClick={() => approveRental(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    marginRight: '10px',
                    cursor: 'pointer'
                  }}
                >
                  <Check size={16} />
                  승인
                </button>
                <button 
                  onClick={() => rejectRental(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '5px 10px',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    marginRight: '10px',
                    cursor: 'pointer'
                  }}
                >
                  <X size={16} />
                  거절
                </button>
              </>
            )}
            
            {type === 'return' && (
              <button 
                onClick={() => processReturn(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  backgroundColor: '#2196f3',
                  color:'#000000',
                  border: 'none',
                  borderRadius: '4px',
                  marginRight: '10px',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={16} />
                반납 처리
              </button>
            )}
            
            <button 
              onClick={() => toggleExpand(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '5px',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>
        
        {isExpanded && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f9f9f9', 
            borderRadius: '4px',
            marginTop: '10px'
          }}>

{isExpanded && (
  <div style={{ 
    padding: '10px', 
    backgroundColor: '#f9f9f9', 
    color: '#000', 
    borderRadius: '4px',
    marginTop: '10px'
  }}>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '15px' }}>
      <p><strong>이름:</strong> {item.userName}</p>
      <p><strong>학번:</strong> {item.userStudentId}</p>
      <p><strong>연락처:</strong> {item.userPhone}</p>
      <p><strong>이메일:</strong> {item.userEmail}</p>
      <p><strong>대여일자:</strong> {formatKoreanDateTime(item.startDateTime)}</p>
      <p><strong>반납일자:</strong> {formatKoreanDateTime(item.endDateTime)}</p>
    </div>

    {item.items && item.items.length > 0 ? (
      item.items.map((equip, idx) => (
        <div key={idx} style={{ display: 'flex', marginBottom: '30px' }}>
          <div style={{ marginRight: '20px' }}>
            {equip.imageURL ? (
              <img 
                src={equip.imageURL}
                alt={equip.name}
                style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }}
              />
            ) : (
              <div style={{ 
                width: '240px', height: '240px',
                backgroundColor: '#E0E0E0', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '8px'
              }}>
                <span>이미지 없음</span>
              </div>
            )}
          </div>
          <div>
            <p><strong>장비 이름:</strong> {equip.name}</p>
          </div>
        </div>
      ))
    ) : (
      <p>장비 정보 없음</p>
    )}

    {item.notes && (
      <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fffde7', borderRadius: '4px' }}>
        <p><strong>추가 메모:</strong></p>
        <p>{item.notes}</p>
      </div>
    )}
  </div>
)}

            <div style={{ display: 'flex', marginBottom: '15px' }}>
            <div style={{ flex: '0 0 200px', marginRight: '20px' }}>
            {item.image ? (
  <img 
    src={item.imageURL} 
    alt={item.name} 
    style={{ 
      width: '180px', 
      height: '180px', 
      objectFit: 'cover',
      borderRadius: '4px' 
    }} 
  />
) : (
  <div style={{ 
    width: '1px', 
    height: '1px', 
    backgroundColor: '#E0E0E0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px'
  }}>
    <span></span>
  </div>
)}
              </div>
              
              <div style={{ flex: '1' }}>
                
                {item.status === 'active' && (
                  <p><strong>대여 기간:</strong> {item.rentalPeriod || '1일'}</p>
                )}
                
                {item.penaltyPoints > 0 && (
                  <p style={{ color: '#f44336' }}>
                    <strong>벌점:</strong> {item.penaltyPoints}점 ({item.penaltyReason})
                  </p>
                )}
              </div>
            </div>
            
            {item.notes && (
              <div style={{ marginTop: '10px', padding: '10px', backgroundColor: '#fffde7', borderRadius: '4px' }}>
                <p><strong>추가 메모:</strong></p>
                <p>{item.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // 탭 컨텐츠 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'pending':
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', color:'#000000 '}}>
              <div>
                <h3>대기 중인 신청 ({pendingRentals.length})</h3>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => toggleSelectAll(pendingRentals)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#E0E0E0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {selectedItems.length === pendingRentals.length && pendingRentals.length > 0 ? '전체 해제' : '전체 선택'}
                </button>
                
                <button 
                  onClick={approveSelectedRentals}
                  disabled={selectedItems.length === 0}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: selectedItems.length > 0 ? '#4caf50' : '#E0E0E0',
                    color: selectedItems.length > 0 ? 'white' : '#9E9E9E',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  선택 항목 승인
                </button>
                
                <button 
                  onClick={rejectSelectedRentals}
                  disabled={selectedItems.length === 0}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: selectedItems.length > 0 ? '#f44336' : '#E0E0E0',
                    color: selectedItems.length > 0 ? 'white' : '#9E9E9E',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  선택 항목 거절
                </button>
              </div>
            </div>
            
            {renderSortControls()}
            
            {pendingRentals.length > 0 ? (
              pendingRentals.map(item => renderRentalItem(item, 'pending'))
              
            ) : (
              

              <div style={{ 
                padding: '30px', 
                textAlign: 'center', 
                backgroundColor: '#f5f5f5',
                borderRadius: '8px'
              }}>
                <p>대기 중인 대여 신청이 없습니다.</p>
              </div>
            )}
          </>
        );
        
      case 'active':
        return (
          <>
            <h3>현재 대여 중인 장비 ({activeRentals.length})</h3>
            {activeRentals.length > 0 ? (
              activeRentals.map(item => renderRentalItem(item, 'active'))
            ) : (
              <div style={{ 
                padding: '30px', 
                textAlign: 'center', 
                backgroundColor: '#f5f5f5',
                borderRadius: '8px'
              }}>
                <p>현재 대여 중인 장비가 없습니다.</p>
              </div>
            )}
          </>
        );
        
      case 'return':
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
              <div>
                <h3>반납 요청 ({returnRequests.length})</h3>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  onClick={() => toggleSelectAll(returnRequests)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#E0E0E0',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {selectedItems.length === returnRequests.length && returnRequests.length > 0 ? '전체 해제' : '전체 선택'}
                </button>
                
                <button 
                  onClick={processSelectedReturns}
                  disabled={selectedItems.length === 0}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: selectedItems.length > 0 ? '#2196f3' : '#E0E0E0',
                    color: selectedItems.length > 0 ? 'white' : '#9E9E9E',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed'
                  }}
                >
                  선택 항목 일괄 반납 처리
                </button>
              </div>
            </div>
            
            {returnRequests.length > 0 ? (
              returnRequests.map(item => renderRentalItem(item, 'return'))
            ) : (
              <div style={{ 
                padding: '30px', 
                textAlign: 'center', 
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
                color:'#000000'
              }}>
                <p>처리 대기 중인 반납 요청이 없습니다.</p>
              </div>
            )}
          </>
        );
        
      default:
        return null;
    }
  };

  // 로딩 상태
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100vh'
      }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  // 메인 렌더링
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        padding: '15px',
        backgroundColor: '#1976d2',
        color: 'white',
        borderRadius: '8px'
      }}>
        <h1 style={{ margin: 0 }}>관리자 페이지</h1>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <User size={18} style={{ marginRight: '5px' }} />
          <span>{admin?.name || '관리자'}</span>
        </div>
      </div>
      
      {/* Navigation */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '20px', 
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        overflow: 'hidden',
        color:'#000000'
      }}>
        <button 
          onClick={handleHomeNavigation}
          style={{ 
            flex: '1',
            padding: '12px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <Home size={20} />
          <span>홈</span>
        </button>
        
        <button 
          onClick={handleCalendarNavigation}
          style={{ 
            flex: '1',
            padding: '12px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <Calendar size={20} />
          <span>캘린더</span>
        </button>
        
        <button 
          onClick={handleNoteNavigation}
          style={{ 
            flex: '1',
            padding: '12px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <FileText size={20} />
          <span>노트</span>
        </button>
        
        <button 
          onClick={handleReservateNavigation}
          style={{ 
            flex: '1',
            padding: '12px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <ShoppingCart size={20} />
          <span>예약</span>
        </button>
      </div>
      
      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        marginBottom: '20px',
        borderBottom: '1px solid #E0E0E0'
      }}>
        <button 
          onClick={() => {
            setActiveTab('pending');
            setSelectedItems([]);
          }}
          style={{ 
            padding: '10px 20px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'pending' ? '3px solid #1976d2' : 'none',
            color: activeTab === 'pending' ? '#1976d2' : '#616161',
            fontWeight: activeTab === 'pending' ? 'bold' : 'normal',
            cursor: 'pointer'
          }}
        >
          대여 신청 관리
        </button>
        
        <button 
          onClick={() => {
            setActiveTab('active');
            setSelectedItems([]);
          }}
          style={{ 
            padding: '10px 20px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'active' ? '3px solid #1976d2' : 'none',
            color: activeTab === 'active' ? '#1976d2' : '#616161',
            fontWeight: activeTab === 'active' ? 'bold' : 'normal',
            cursor: 'pointer'
          }}
        >
          대여 중인 장비
        </button>
        
        <button 
          onClick={() => {
            setActiveTab('return');
            setSelectedItems([]);
          }}
          style={{ 
            padding: '10px 20px',
            border: 'none',
            backgroundColor: 'transparent',
            borderBottom: activeTab === 'return' ? '3px solid #1976d2' : 'none',
            color: activeTab === 'return' ? '#1976d2' : '#616161',
            fontWeight: activeTab === 'return' ? 'bold' : 'normal',
            cursor: 'pointer'
          }}
        >
          반납 요청 관리
        </button>
      </div>
      
      {/* Main Content */}
      <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
        {renderTabContent()}
      </div>
      
      {/* Penalty Modal */}
      {renderPenaltyModal()}
      
      {/* Footer */}
      <div style={{ marginTop: '30px', textAlign: 'center', color: '#757575', fontSize: '14px' }}>
        <p>© 2025 장비 대여 관리 시스템</p>
      </div>
    </div>
  );
};

export default AdminPage;