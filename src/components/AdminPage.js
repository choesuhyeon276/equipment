// src/components/AdminPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  ShoppingCart,
  FileText,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  RefreshCw,
  Home,
  Calendar,
  Settings as SettingsIcon,
  Database,
} from 'lucide-react';

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
  serverTimestamp,
  writeBatch,
  // ❌ orderBy 는 firebaseConfig에서 export되지 않으므로 사용 안함
} from '../firebase/firebaseConfig';

/** YYYY년 MM월 DD일 HH시 mm분 표시 */
const formatKoreanDateTime = (isoStringOrDateOrTimestamp) => {
  if (!isoStringOrDateOrTimestamp) return '날짜 없음';

  // Firebase Timestamp 지원 + string/Date 지원
  let date;
  if (isoStringOrDateOrTimestamp?.toDate) {
    date = isoStringOrDateOrTimestamp.toDate();
  } else if (typeof isoStringOrDateOrTimestamp === 'string' || isoStringOrDateOrTimestamp instanceof Date) {
    date = new Date(isoStringOrDateOrTimestamp);
  }

  if (!date || Number.isNaN(date.getTime())) return '날짜 없음';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  return `${year}년 ${month}월 ${day}일 ${hour}시 ${minute}분`;
};

const AdminPage = () => {
  const navigate = useNavigate();

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  const [pendingRentals, setPendingRentals] = useState([]);
  const [activeRentals, setActiveRentals] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [completedRentals, setCompletedRentals] = useState([]);

  const [activeTab, setActiveTab] = useState('pending'); // pending | active | return | completed
  const [expandedItems, setExpandedItems] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);

  const [sortBy, setSortBy] = useState('userName'); // userName | userId | rentalDate | name

  // penalty modal
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [penaltyPoints, setPenaltyPoints] = useState(0);
  const [penaltyReason, setPenaltyReason] = useState('');

  // ------- Nav Handlers -------
  const handleHomeNavigation = () => navigate('/main');
  const handleCalendarNavigation = () => navigate('/calendar-with-header');
  const handleManagementNavigation = () => navigate('/cameramanagement');
  const handleReservateNavigation = () => navigate('/ReservationMainPage');
  const handleSettingsNavigation = () => navigate('/admin-settings');
  const handleSyncNavigation = () => navigate('/sync');

  // ------- Auth + Admin check -------
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (!firebaseUser) {
        setAdmin(null);
        setLoading(false);
        navigate('/login');
        return;
      }

      const isAdmin = await checkAdminRole(firebaseUser.uid);
      if (!isAdmin) {
        alert('관리자 권한이 없습니다.');
        navigate('/main');
        return;
      }

      setAdmin({
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        name: firebaseUser.displayName || '관리자',
      });

      await fetchRentalData();
    });

    return () => unsubscribe();
    
  }, []);

  const checkAdminRole = async (userId) => {
    try {
      const userRef = doc(db, 'user_profiles', userId);
      const userDoc = await getDoc(userRef);
      return userDoc.exists() && userDoc.data().role === 'admin';
    } catch (e) {
      console.error('Error checking admin role:', e);
      return false;
    }
  };

  // ------- Fetch all rental data -------
  const fetchRentalData = async () => {
    setLoading(true);
    try {
      // 1) pending
      const pendingSnapshot = await getDocs(
        query(collection(db, 'reservations'), where('status', '==', 'pending'))
      );
      const pendingDataRaw = pendingSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const pendingData = await enrichWithUserProfiles(pendingDataRaw);

      // 2) active
      const activeSnapshot = await getDocs(
        query(collection(db, 'reservations'), where('status', '==', 'active'))
      );
      const activeDataRaw = activeSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const activeData = await enrichWithUserProfiles(activeDataRaw);

      // 3) return_requested
      const returnSnapshot = await getDocs(
        query(collection(db, 'reservations'), where('status', '==', 'return_requested'))
      );
      const returnDataRaw = returnSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const returnData = await enrichWithUserProfiles(returnDataRaw);

      // 4) completed (returned) - orderBy 없이 클라에서 정렬
      const completedSnapshot = await getDocs(
        query(collection(db, 'reservations'), where('status', '==', 'returned'))
      );
      const completedRaw = completedSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const completedData = (await enrichWithUserProfiles(completedRaw)).sort((a, b) => {
        const at = a.returnedAt?.toDate ? a.returnedAt.toDate().getTime() : 0;
        const bt = b.returnedAt?.toDate ? b.returnedAt.toDate().getTime() : 0;
        return bt - at; // 최신 반환 먼저
      });

      setPendingRentals(sortRentalData(pendingData, sortBy));
      setActiveRentals(sortRentalData(activeData, sortBy));
      setReturnRequests(sortRentalData(returnData, sortBy));
      setCompletedRentals(sortRentalData(completedData, sortBy));

      setSelectedItems([]);
    } catch (e) {
      console.error('Error fetching rental data:', e);
    } finally {
      setLoading(false);
    }
  };

  // 사용자 정보 보강
  const enrichWithUserProfiles = async (list) => {
    return Promise.all(
      list.map(async (rental) => {
        if (!rental.userId) return rental;
        try {
          const userRef = doc(db, 'user_profiles', rental.userId);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const u = userDoc.data();
            return {
              ...rental,
              userName: u.name || rental.userName || '이름 없음',
              userEmail: u.email || rental.userEmail || '이메일 없음',
              userPhone: u.phoneNumber || '',
              userStudentId: u.studentId || '',
              userPenalty: u.penaltyPoints || 0,
              userPenaltyHistory: u.penaltyHistory || [],
              userPledge: u.pledgeFileURL || '',
            };
          }
        } catch (e) {
          console.error('Error fetching user profile:', e);
        }
        return rental;
      })
    );
  };

  // ------- Sort -------
  const sortRentalData = (data, sortKey) => {
    const copy = [...data];
    return copy.sort((a, b) => {
      switch (sortKey) {
        case 'userName':
          return (a.userName || '').localeCompare(b.userName || '');
        case 'userId':
          return (a.userId || '').localeCompare(b.userId || '');
        case 'rentalDate': {
          const at =
            new Date(a.startDateTime || a.rentalDate || 0).getTime() ||
            (a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0);
          const bt =
            new Date(b.startDateTime || b.rentalDate || 0).getTime() ||
            (b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0);
          return at - bt;
        }
        case 'name': {
          // 메인 아이템명(요청서의 대표 이름)이 있다면 name, 없으면 첫 장비 이름
          const an = a.name || a.items?.[0]?.name || '';
          const bn = b.name || b.items?.[0]?.name || '';
          return an.localeCompare(bn);
        }
        default:
          return 0;
      }
    });
  };

  const handleSortChange = (key) => {
    setSortBy(key);
    if (activeTab === 'pending') setPendingRentals(sortRentalData(pendingRentals, key));
    if (activeTab === 'active') setActiveRentals(sortRentalData(activeRentals, key));
    if (activeTab === 'return') setReturnRequests(sortRentalData(returnRequests, key));
    if (activeTab === 'completed') setCompletedRentals(sortRentalData(completedRentals, key));
  };

  // ------- selection -------
  const toggleSelectItem = (id) => {
    setSelectedItems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };
  const toggleSelectAll = (items) => {
    if (selectedItems.length === items.length) setSelectedItems([]);
    else setSelectedItems(items.map((i) => i.id));
  };

  // ------- Approve / Reject (single) -------
  const approveRental = async (rentalId) => {
    try {
      const rentalRef = doc(db, 'reservations', rentalId);
      await updateDoc(rentalRef, {
        status: 'active',
        approvedAt: serverTimestamp(),
        approvedBy: admin.uid,
      });

      // 장비 상태 업데이트
      const rentalDoc = await getDoc(rentalRef);
      const rentalData = rentalDoc.data();
      if (rentalData?.equipmentId) {
        await updateDoc(doc(db, 'cameras', rentalData.equipmentId), {
          status: 'rented',
          lastRentalId: rentalId,
        });
      }

      // 구글 캘린더 등록(실패 무시)
      try {
        await fetch('/api/addEventToCalendar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `[장비 대여 승인] ${rentalData.name || rentalData.items?.[0]?.name || ''}`,
            description: `사용자: ${rentalData.userName || rentalData.userId}\n사용 목적: ${
              rentalData.purpose || '없음'
            }`,
            startDate: rentalData.rentalDate,
            startTime: rentalData.rentalTime,
            endDate: rentalData.returnDate,
            endTime: rentalData.returnTime,
          }),
        });
      } catch (e) {
        console.warn('캘린더 등록 실패(무시):', e);
      }

      alert('대여 신청이 승인되었습니다.');
      fetchRentalData();
    } catch (e) {
      console.error('Error approving rental:', e);
      alert('승인 처리 중 오류가 발생했습니다.');
    }
  };

  const rejectRental = async (rentalId) => {
    try {
      await updateDoc(doc(db, 'reservations', rentalId), {
        status: 'rejected',
        rejectedAt: serverTimestamp(),
        rejectedBy: admin.uid,
      });
      alert('대여 신청이 거절되었습니다.');
      fetchRentalData();
    } catch (e) {
      console.error('Error rejecting rental:', e);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  // ------- Approve / Reject (batch) -------
  const approveSelectedRentals = async () => {
    if (selectedItems.length === 0) return alert('선택된 항목이 없습니다.');
    if (!confirm(`선택한 ${selectedItems.length}개 항목을 승인하시겠습니까?`)) return;

    try {
      const batch = writeBatch(db);
      selectedItems.forEach((id) => {
        batch.update(doc(db, 'reservations', id), {
          status: 'active',
          approvedAt: serverTimestamp(),
          approvedBy: admin.uid,
        });
      });
      await batch.commit();

      // 각 장비 상태 업데이트
      for (const rentalId of selectedItems) {
        const rDoc = await getDoc(doc(db, 'reservations', rentalId));
        const rData = rDoc.data();
        if (rData?.equipmentId) {
          await updateDoc(doc(db, 'cameras', rData.equipmentId), {
            status: 'rented',
            lastRentalId: rentalId,
          });
        }
      }

      alert(`${selectedItems.length}개 항목이 승인되었습니다.`);
      setSelectedItems([]);
      fetchRentalData();
    } catch (e) {
      console.error('Error approving rentals:', e);
      alert('일괄 승인 중 오류가 발생했습니다.');
    }
  };

  const rejectSelectedRentals = async () => {
    if (selectedItems.length === 0) return alert('선택된 항목이 없습니다.');
    if (!confirm(`선택한 ${selectedItems.length}개 항목을 거절하시겠습니까?`)) return;

    try {
      const batch = writeBatch(db);
      selectedItems.forEach((id) => {
        batch.update(doc(db, 'reservations', id), {
          status: 'rejected',
          rejectedAt: serverTimestamp(),
          rejectedBy: admin.uid,
        });
      });
      await batch.commit();

      alert(`${selectedItems.length}개 항목이 거절되었습니다.`);
      setSelectedItems([]);
      fetchRentalData();
    } catch (e) {
      console.error('Error rejecting rentals:', e);
      alert('일괄 거절 중 오류가 발생했습니다.');
    }
  };

  // ------- Return processing -------
  const processReturn = async (rentalId) => {
    try {
      const rentalRef = doc(db, 'reservations', rentalId);
      const rentalDoc = await getDoc(rentalRef);
      const rentalData = rentalDoc.data();

      const hasIssues = confirm('반납된 장비에 문제가 있습니까? (확인: 예, 취소: 아니오)');
      if (hasIssues) {
        setCurrentUser({
          id: rentalData.userId,
          name: rentalData.userName || '사용자',
          rentalId,
        });
        setPenaltyPoints(0);
        setPenaltyReason('');
        setPenaltyModalOpen(true);
        return;
      }

      // 정상 반납
      await updateDoc(rentalRef, {
        status: 'returned',
        returnedAt: serverTimestamp(),
        processedBy: admin.uid,
        returnStatus: 'normal',
      });

      if (rentalData?.equipmentId) {
        await updateDoc(doc(db, 'cameras', rentalData.equipmentId), {
          status: 'available',
          lastRentalId: null,
        });
      }

      alert('반납 처리가 완료되었습니다.');
      fetchRentalData();
    } catch (e) {
      console.error('Error processing return:', e);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  const applyPenaltyAndProcessReturn = async () => {
    if (!currentUser || penaltyPoints <= 0 || !penaltyReason) {
      alert('벌점 정보를 모두 입력해주세요.');
      return;
    }

    try {
      // 1) 대여 반납 + 벌점 기록
      const rentalRef = doc(db, 'reservations', currentUser.rentalId);
      await updateDoc(rentalRef, {
        status: 'returned',
        returnedAt: serverTimestamp(),
        processedBy: admin.uid,
        returnStatus: 'damaged',
        penaltyPoints,
        penaltyReason,
      });

      // 2) 사용자 벌점
      const userRef = doc(db, 'user_profiles', currentUser.id);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const currentPenalty = userDoc.data().penaltyPoints || 0;
        await updateDoc(userRef, {
          penaltyPoints: currentPenalty + Number(penaltyPoints),
          penaltyHistory: [
            ...(userDoc.data().penaltyHistory || []),
            {
              points: Number(penaltyPoints),
              reason: penaltyReason,
              date: new Date(), // 클라이언트 시간 기록(간단)
              rentalId: currentUser.rentalId,
              adminId: admin.uid,
            },
          ],
        });
      } else {
        console.warn('user_profiles 문서가 존재하지 않습니다.');
      }

      // 3) 장비 damageHistory
      const rDoc = await getDoc(rentalRef);
      const equipmentId = rDoc.data()?.equipmentId;
      if (equipmentId) {
        const eqRef = doc(db, 'cameras', equipmentId);
        const eqDoc = await getDoc(eqRef);
        if (eqDoc.exists()) {
          await updateDoc(eqRef, {
            status: 'available',
            lastRentalId: null,
            damageHistory: [
              ...(eqDoc.data().damageHistory || []),
              {
                date: serverTimestamp(),
                description: penaltyReason,
                rentalId: currentUser.rentalId,
                userId: currentUser.id,
              },
            ],
          });
        }
      }

      alert(`반납 처리 및 ${penaltyPoints}점의 벌점이 부과되었습니다.`);
      setPenaltyModalOpen(false);
      setPenaltyPoints(0);
      setPenaltyReason('');
      setCurrentUser(null);
      fetchRentalData();
    } catch (e) {
      console.error('Error applying penalty:', e);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  const processSelectedReturns = async () => {
    if (selectedItems.length === 0) return alert('선택된 항목이 없습니다.');
    if (!confirm(`선택한 ${selectedItems.length}개 항목을 정상 반납 처리하시겠습니까?`)) return;

    try {
      const batch = writeBatch(db);
      selectedItems.forEach((id) => {
        batch.update(doc(db, 'reservations', id), {
          status: 'returned',
          returnedAt: serverTimestamp(),
          processedBy: admin.uid,
          returnStatus: 'normal',
        });
      });
      await batch.commit();

      // 장비 상태 각각 업데이트
      for (const rentalId of selectedItems) {
        const rDoc = await getDoc(doc(db, 'reservations', rentalId));
        const eqId = rDoc.data()?.equipmentId;
        if (eqId) {
          await updateDoc(doc(db, 'cameras', eqId), {
            status: 'available',
            lastRentalId: null,
          });
        }
      }

      alert(`${selectedItems.length}개 항목이 반납 처리되었습니다.`);
      setSelectedItems([]);
      fetchRentalData();
    } catch (e) {
      console.error('Error batch processing returns:', e);
      alert('일괄 처리 중 오류가 발생했습니다.');
    }
  };

  // ------- UI helpers -------
  const toggleExpand = (id) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderSortControls = () => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: 15,
        padding: 10,
        backgroundColor: '#f5f5f5',
        borderRadius: 4,
      }}
    >
      <span style={{ marginRight: 15, fontWeight: 'bold', color: '#000' }}>정렬:</span>
      <div style={{ display: 'flex', gap: 10 }}>
        {[
          { key: 'userName', label: '이름순' },
          { key: 'userId', label: '사용자ID순' },
          { key: 'rentalDate', label: '날짜순' },
          { key: 'name', label: '장비순' },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => handleSortChange(opt.key)}
            style={{
              padding: '5px 10px',
              backgroundColor: sortBy === opt.key ? '#2196F3' : '#E0E0E0',
              color: sortBy === opt.key ? 'white' : 'black',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );

  const renderPenaltyModal = () => {
    if (!penaltyModalOpen) return null;
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0,0,0,.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
          color: '#000',
        }}
      >
        <div style={{ backgroundColor: '#fff', padding: 30, borderRadius: 10, width: 500 }}>
          <h3 style={{ marginTop: 0, marginBottom: 20 }}>벌점 부과</h3>
          <p>
            <strong>사용자:</strong> {currentUser?.name}
          </p>
          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 5 }}>벌점 (1-10점):</label>
            <input
              type="number"
              min="1"
              max="10"
              value={penaltyPoints}
              onChange={(e) => setPenaltyPoints(parseInt(e.target.value || '0', 10))}
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #ccc',
                borderRadius: 4,
              }}
            />
          </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 5 }}>사유:</label>
              <textarea
                value={penaltyReason}
                onChange={(e) => setPenaltyReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  minHeight: 100,
                }}
                placeholder="벌점 부과 사유를 자세히 입력해주세요."
              />
            </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
            <button
              onClick={() => setPenaltyModalOpen(false)}
              style={{
                padding: '8px 15px',
                border: '1px solid #ccc',
                borderRadius: 4,
                backgroundColor: '#f5f5f5',
              }}
            >
              취소
            </button>
            <button
              onClick={applyPenaltyAndProcessReturn}
              style={{
                padding: '8px 15px',
                backgroundColor: '#e53935',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
              }}
            >
              벌점 부과 및 반납 처리
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderRentalItem = (item, type) => {
    const isExpanded = expandedItems[item.id] || false;
    const isSelected = selectedItems.includes(item.id);

    return (
      <div
        key={item.id}
        style={{
          border: '1px solid #E0E0E0',
          borderRadius: 8,
          padding: 15,
          marginBottom: 15,
          backgroundColor: isSelected ? '#f0f7ff' : '#fff',
        }}
      >
        {/* Header line */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {type !== 'completed' && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelectItem(item.id)}
                style={{ marginRight: 10 }}
              />
            )}
            <h3
              style={{
                fontSize: 18,
                fontWeight: 'bold',
                cursor: 'pointer',
                margin: 0,
                color: '#000',
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
                    gap: 5,
                    padding: '5px 10px',
                    backgroundColor: '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    marginRight: 10,
                    cursor: 'pointer',
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
                    gap: 5,
                    padding: '5px 10px',
                    backgroundColor: '#f44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    marginRight: 10,
                    cursor: 'pointer',
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
                  gap: 5,
                  padding: '5px 10px',
                  backgroundColor: '#2196f3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  marginRight: 10,
                  cursor: 'pointer',
                }}
              >
                <RefreshCw size={16} />
                반납 처리
              </button>
            )}

            {type === 'completed' && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '5px 10px',
                  backgroundColor: '#4caf50',
                  color: '#fff',
                  borderRadius: 4,
                  marginRight: 10,
                  fontSize: 14,
                }}
              >
                <Check size={16} />
                완료
              </div>
            )}

            <button
              onClick={() => toggleExpand(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 5,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          </div>
        </div>

        {/* Expanded */}
        {isExpanded && (
          <div
            style={{
              padding: 10,
              backgroundColor: '#f9f9f9',
              borderRadius: 4,
              marginTop: 10,
              color: '#000',
            }}
          >
            {/* 사용자 & 일정 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 15 }}>
              <p>
                <strong>이름:</strong> {item.userName}
              </p>
              <p>
                <strong>학번:</strong> {item.userStudentId}
              </p>
              <p>
                <strong>연락처:</strong> {item.userPhone}
              </p>
              <p>
                <strong>이메일:</strong> {item.userEmail}
              </p>
              <p>
                <strong>대여일자:</strong> {formatKoreanDateTime(item.startDateTime)}
              </p>
              <p>
                <strong>반납일자:</strong> {formatKoreanDateTime(item.endDateTime)}
              </p>

              {/* 완료 탭 추가 정보 */}
              {type === 'completed' && item.returnedAt && (
                <p>
                  <strong>실제 반납일:</strong> {formatKoreanDateTime(item.returnedAt)}
                </p>
              )}
              {type === 'completed' && item.returnStatus && (
                <p>
                  <strong>반납 상태:</strong>{' '}
                  <span
                    style={{
                      color:
                        item.returnStatus === 'normal'
                          ? '#4caf50'
                          : item.returnStatus === 'damaged'
                          ? '#ff9800'
                          : '#e53935',
                      fontWeight: 'bold',
                      marginLeft: 5,
                    }}
                  >
                    {item.returnStatus === 'normal'
                      ? '정상 반납'
                      : item.returnStatus === 'damaged'
                      ? '문제 있음 (벌점 부과)'
                      : item.returnStatus === 'late'
                      ? '연체'
                      : item.returnStatus}
                  </span>
                </p>
              )}
              {type === 'completed' && item.penaltyPoints > 0 && (
                <p>
                  <strong>부과된 벌점:</strong>{' '}
                  <span style={{ color: '#e53935', fontWeight: 'bold', marginLeft: 5 }}>
                    {item.penaltyPoints}점
                  </span>
                  {item.penaltyReason && <span> ({item.penaltyReason})</span>}
                </p>
              )}
            </div>

            {/* 장비 목록 */}
            {Array.isArray(item.items) && item.items.length > 0 ? (
              item.items.map((equip, idx) => (
                <div key={idx} style={{ display: 'flex', marginBottom: 20 }}>
                  <div style={{ marginRight: 20 }}>
                    {equip.imageURL ? (
                      <img
                        src={equip.imageURL}
                        alt={equip.name}
                        style={{
                          width: 100,
                          height: 100,
                          objectFit: 'cover',
                          borderRadius: 8,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 240,
                          height: 240,
                          backgroundColor: '#E0E0E0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 8,
                        }}
                      >
                        <span>이미지 없음</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <p>
                      <strong>장비 이름:</strong> {equip.name}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p>장비 정보 없음</p>
            )}

            {/* 반납 사진 */}
            {(type === 'completed' || type === 'return') && item.returnImageURL && (
              <div style={{ marginTop: 10 }}>
                <p>
                  <strong>반납 확인 사진:</strong>
                </p>
                <img
                  src={item.returnImageURL}
                  alt="반납 이미지"
                  style={{ width: 540, borderRadius: 8, objectFit: 'cover' }}
                />
              </div>
            )}

            {/* 장기 대여자 표시 */}
            {item.long_imageURL && (
              <>
                <div
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#fdd835',
                    color: '#000',
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 12,
                    fontWeight: 'bold',
                    marginBottom: 10,
                    marginTop: 10,
                  }}
                >
                  장기 대여자
                </div>
                <div style={{ marginTop: 10 }}>
                  <p>
                    <strong>장기 대여 첨부 이미지:</strong>
                  </p>
                  <img
                    src={item.long_imageURL}
                    alt="장기 대여 이미지"
                    style={{ width: 540, borderRadius: 8, objectFit: 'cover' }}
                  />
                </div>
              </>
            )}

            {/* 비고 */}
            {item.notes && (
              <div style={{ marginTop: 10, padding: 10, backgroundColor: '#fffde7', borderRadius: 4 }}>
                <p>
                  <strong>추가 메모:</strong>
                </p>
                <p>{item.notes}</p>
              </div>
            )}

            {/* 벌점 info (항목 자체에 저장된 경우) */}
            {item.penaltyPoints > 0 && (
              <p style={{ color: '#f44336' }}>
                <strong>벌점:</strong> {item.penaltyPoints}점 ({item.penaltyReason || '사유 없음'})
              </p>
            )}
          </div>
        )}
      </div>
    );
  };

  // ------- Tabs -------
  const renderTabContent = () => {
    if (activeTab === 'pending') {
      return (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15, color: '#000' }}>
            <div>
              <h3>대기 중인 신청 ({pendingRentals.length})</h3>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => toggleSelectAll(pendingRentals)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#E0E0E0',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
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
                  borderRadius: 4,
                  cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed',
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
                  borderRadius: 4,
                  cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                선택 항목 거절
              </button>
            </div>
          </div>

          {renderSortControls()}

          {pendingRentals.length > 0 ? (
            pendingRentals.map((item) => renderRentalItem(item, 'pending'))
          ) : (
            <div
              style={{
                padding: 30,
                textAlign: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
                color: '#000',
              }}
            >
              <p>대기 중인 대여 신청이 없습니다.</p>
            </div>
          )}
        </>
      );
    }

    if (activeTab === 'active') {
      return (
        <>
          <h3>현재 대여 중인 장비 ({activeRentals.length})</h3>
          {renderSortControls()}
          {activeRentals.length > 0 ? (
            activeRentals.map((item) => renderRentalItem(item, 'active'))
          ) : (
            <div
              style={{
                padding: 30,
                textAlign: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
                color: '#000',
              }}
            >
              <p>현재 대여 중인 장비가 없습니다.</p>
            </div>
          )}
        </>
      );
    }

    if (activeTab === 'return') {
      return (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
            <div>
              <h3>반납 요청 ({returnRequests.length})</h3>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => toggleSelectAll(returnRequests)}
                style={{
                  padding: '5px 10px',
                  backgroundColor: '#E0E0E0',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                {selectedItems.length === returnRequests.length && returnRequests.length > 0
                  ? '전체 해제'
                  : '전체 선택'}
              </button>

              <button
                onClick={processSelectedReturns}
                disabled={selectedItems.length === 0}
                style={{
                  padding: '5px 10px',
                  backgroundColor: selectedItems.length > 0 ? '#2196f3' : '#E0E0E0',
                  color: selectedItems.length > 0 ? 'white' : '#9E9E9E',
                  border: 'none',
                  borderRadius: 4,
                  cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed',
                }}
              >
                선택 항목 일괄 반납 처리
              </button>
            </div>
          </div>

          {renderSortControls()}

          {returnRequests.length > 0 ? (
            returnRequests.map((item) => renderRentalItem(item, 'return'))
          ) : (
            <div
              style={{
                padding: 30,
                textAlign: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
                color: '#000',
              }}
            >
              <p>처리 대기 중인 반납 요청이 없습니다.</p>
            </div>
          )}
        </>
      );
    }

    if (activeTab === 'completed') {
      return (
        <>
          <h3>반납 완료 ({completedRentals.length})</h3>
          {renderSortControls()}
          {completedRentals.length > 0 ? (
            completedRentals.map((item) => renderRentalItem(item, 'completed'))
          ) : (
            <div
              style={{
                padding: 30,
                textAlign: 'center',
                backgroundColor: '#f5f5f5',
                borderRadius: 8,
                color: '#000',
              }}
            >
              <p>반납 완료된 기록이 없습니다.</p>
            </div>
          )}
        </>
      );
    }

    return null;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>로딩 중...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          padding: 15,
          backgroundColor: '#1976d2',
          color: '#fff',
          borderRadius: 8,
        }}
      >
        <h1 style={{ margin: 0 }}>관리자 페이지</h1>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <User size={18} style={{ marginRight: 5 }} />
          <span>{admin?.name || '관리자'}</span>
        </div>
      </div>

      {/* Top Nav */}
      <div
        style={{
          display: 'flex',
          marginBottom: 20,
          backgroundColor: '#f5f5f5',
          borderRadius: 8,
          overflow: 'hidden',
          color: '#000',
        }}
      >
        <button
          onClick={handleHomeNavigation}
          style={{
            flex: 1,
            padding: 12,
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Home size={20} />
          <span>홈</span>
        </button>

        <button
          onClick={handleCalendarNavigation}
          style={{
            flex: 1,
            padding: 12,
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Calendar size={20} />
          <span>캘린더</span>
        </button>

        <button
          onClick={handleManagementNavigation}
          style={{
            flex: 1,
            padding: 12,
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <FileText size={20} />
          <span>장비관리</span>
        </button>

        <button
          onClick={handleReservateNavigation}
          style={{
            flex: 1,
            padding: 12,
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <ShoppingCart size={20} />
          <span>예약</span>
        </button>

        <button
          onClick={handleSyncNavigation}
          style={{
            flex: 1,
            padding: 12,
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Database size={20} />
          <span>스프레드시트</span>
        </button>

        <button
          onClick={handleSettingsNavigation}
          style={{
            flex: 1,
            padding: 12,
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <SettingsIcon size={20} />
          <span>설정</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: 20, borderBottom: '1px solid #E0E0E0' }}>
        {[
          { key: 'pending', label: '대여 신청 관리' },
          { key: 'active', label: '대여 중인 장비' },
          { key: 'return', label: '반납 요청 관리' },
          { key: 'completed', label: '반납 완료' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setActiveTab(t.key);
              setSelectedItems([]);
            }}
            style={{
              padding: '10px 20px',
              border: 'none',
              backgroundColor: 'transparent',
              borderBottom: activeTab === t.key ? '3px solid #1976d2' : 'none',
              color: activeTab === t.key ? '#1976d2' : '#616161',
              fontWeight: activeTab === t.key ? 'bold' : 'normal',
              cursor: 'pointer',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ backgroundColor: '#fff', padding: 20, borderRadius: 8 }}>{renderTabContent()}</div>

      {/* Penalty Modal */}
      {renderPenaltyModal()}

      {/* Footer */}
      <div style={{ marginTop: 30, textAlign: 'center', color: '#757575', fontSize: 14 }}>
        <p>© 2025 장비 대여 관리 시스템</p>
      </div>
    </div>
  );
};

export default AdminPage;