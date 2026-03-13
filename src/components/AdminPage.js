'use client';

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
  AlertCircle,
  Ban,
  Users,
  Search,
  Mail,
  Phone,
  CreditCard,
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
} from '../firebase/firebaseConfig';

/** YYYY년 MM월 DD일 HH시 mm분 표시 */
const formatKoreanDateTime = (isoStringOrDateOrTimestamp) => {
  if (!isoStringOrDateOrTimestamp) return '날짜 없음';
  let date;
  if (isoStringOrDateOrTimestamp?.toDate) {
    date = isoStringOrDateOrTimestamp.toDate();
  } else if (
    typeof isoStringOrDateOrTimestamp === 'string' ||
    isoStringOrDateOrTimestamp instanceof Date
  ) {
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

// 벌점 사유 목록
const PENALTY_REASONS = [
  { value: 'late', label: '연체', defaultPoints: 5 },
  { value: 'damage', label: '장비 파손', defaultPoints: 10 },
  { value: 'lost', label: '장비 분실', defaultPoints: 20 },
  { value: 'illegal_sublease', label: '불법 대여 (타인에게 양도)', defaultPoints: 15 },
  { value: 'dirty', label: '장비 내부 정리 미흡', defaultPoints: 3 },
  { value: 'incomplete', label: '구성품 누락', defaultPoints: 7 },
  { value: 'no_return_image', label: '반납이미지 미첨부', defaultPoints: 3 },
  { value: 'wrong_return_location', label: '반납장소 미준수', defaultPoints: 5 },
  { value: 'other', label: '기타 사유', defaultPoints: 5 },
];

const AdminPage = () => {
  const navigate = useNavigate();
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingRentals, setPendingRentals] = useState([]);
  const [activeRentals, setActiveRentals] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [completedRentals, setCompletedRentals] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [expandedItems, setExpandedItems] = useState({});
  const [selectedItems, setSelectedItems] = useState([]);
  const [sortBy, setSortBy] = useState('userName');

  // 유저 관리 관련 state
  const [allUsers, setAllUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userSortBy, setUserSortBy] = useState('name');
  const [expandedUsers, setExpandedUsers] = useState({});

  // penalty modal
  const [penaltyModalOpen, setPenaltyModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [penaltyPoints, setPenaltyPoints] = useState(0);
  const [penaltyReason, setPenaltyReason] = useState('');
  const [selectedPenaltyType, setSelectedPenaltyType] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [forceReturnMode, setForceReturnMode] = useState(false); // 강제 반납 여부

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
      await fetchAllUsers();
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

  // ------- Fetch all users -------
  const fetchAllUsers = async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'user_profiles'));
      const usersData = usersSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      
      // 각 유저의 대여 이력 수를 가져옴
      const usersWithRentalCount = await Promise.all(
        usersData.map(async (user) => {
          const rentalSnapshot = await getDocs(
            query(collection(db, 'reservations'), where('userId', '==', user.id))
          );
          return {
            ...user,
            rentalCount: rentalSnapshot.docs.length,
          };
        })
      );
      
      setAllUsers(sortUserData(usersWithRentalCount, userSortBy));
    } catch (e) {
      console.error('Error fetching users:', e);
    }
  };

  // ------- Sort Users -------
  const sortUserData = (data, sortKey) => {
    const copy = [...data];
    return copy.sort((a, b) => {
      switch (sortKey) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'studentId':
          return (a.studentId || '').localeCompare(b.studentId || '');
        case 'penaltyPoints':
          return (b.penaltyPoints || 0) - (a.penaltyPoints || 0);
        case 'rentalCount':
          return (b.rentalCount || 0) - (a.rentalCount || 0);
        default:
          return 0;
      }
    });
  };

  const handleUserSortChange = (key) => {
    setUserSortBy(key);
    setAllUsers(sortUserData(allUsers, key));
  };

  // 유저 검색 필터
  const filteredUsers = allUsers.filter((user) => {
    const searchLower = userSearchTerm.toLowerCase();
    return (
      (user.name || '').toLowerCase().includes(searchLower) ||
      (user.email || '').toLowerCase().includes(searchLower) ||
      (user.studentId || '').toLowerCase().includes(searchLower) ||
      (user.phoneNumber || '').toLowerCase().includes(searchLower)
    );
  });

  // ------- Fetch all rental data -------
  const fetchRentalData = async () => {
    setLoading(true);
    try {
      const pendingSnapshot = await getDocs(
        query(collection(db, 'reservations'), where('status', '==', 'pending'))
      );
      const pendingDataRaw = pendingSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const pendingData = await enrichWithUserProfiles(pendingDataRaw);

      const activeSnapshot = await getDocs(
        query(collection(db, 'reservations'), where('status', '==', 'active'))
      );
      const activeDataRaw = activeSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const activeData = await enrichWithUserProfiles(activeDataRaw);

      const returnSnapshot = await getDocs(
        query(collection(db, 'reservations'), where('status', '==', 'return_requested'))
      );
      const returnDataRaw = returnSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const returnData = await enrichWithUserProfiles(returnDataRaw);

      const completedSnapshot = await getDocs(
        query(collection(db, 'reservations'), where('status', '==', 'returned'))
      );
      const completedRaw = completedSnapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      const completedData = (await enrichWithUserProfiles(completedRaw)).sort((a, b) => {
        const at = a.returnedAt?.toDate ? a.returnedAt.toDate().getTime() : 0;
        const bt = b.returnedAt?.toDate ? b.returnedAt.toDate().getTime() : 0;
        return bt - at;
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
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = (items) => {
    if (selectedItems.length === items.length) setSelectedItems([]);
    else setSelectedItems(items.map((i) => i.id));
  };

  // ------- Approve / Reject -------
  const approveRental = async (rentalId) => {
    try {
      const rentalRef = doc(db, 'reservations', rentalId);
      await updateDoc(rentalRef, {
        status: 'active',
        approvedAt: serverTimestamp(),
        approvedBy: admin.uid,
      });
      const rentalDoc = await getDoc(rentalRef);
      const rentalData = rentalDoc.data();
      if (rentalData?.equipmentId) {
        await updateDoc(doc(db, 'cameras', rentalData.equipmentId), {
          status: 'rented',
          lastRentalId: rentalId,
        });
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

  // ------- 강제 반납 처리 (대여 중인 장비에서) -------
  const openForceReturnModal = (rental) => {
    setForceReturnMode(true);
    setCurrentUser({
      id: rental.userId,
      name: rental.userName || '사용자',
      rentalId: rental.id,
    });
    setPenaltyPoints(0);
    setSelectedPenaltyType('');
    setCustomReason('');
    setPenaltyModalOpen(true);
  };

  // ------- 반납 처리 (반납 요청 관리에서) -------
  const processReturn = async (rentalId) => {
    const rentalRef = doc(db, 'reservations', rentalId);
    const rentalDoc = await getDoc(rentalRef);
    const rentalData = rentalDoc.data();

    const hasIssues = confirm(
      '반납된 장비에 문제가 있습니까?\n\n확인 = 문제 있음 (벌점 부과)\n취소 = 정상 반납'
    );

    if (hasIssues) {
      setForceReturnMode(false);
      setCurrentUser({
        id: rentalData.userId,
        name: rentalData.userName || '사용자',
        rentalId,
      });
      setPenaltyPoints(0);
      setSelectedPenaltyType('');
      setCustomReason('');
      setPenaltyModalOpen(true);
      return;
    }

    // 정상 반납
    try {
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
      alert('정상 반납 처리가 완료되었습니다.');
      fetchRentalData();
    } catch (e) {
      console.error('Error processing return:', e);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  // ------- 벌점 사유 선택 시 자동으로 벌점 입력 -------
  const handlePenaltyTypeChange = (e) => {
    const type = e.target.value;
    setSelectedPenaltyType(type);
    const found = PENALTY_REASONS.find((r) => r.value === type);
    if (found) {
      setPenaltyPoints(found.defaultPoints);
    }
  };

  // ------- 벌점 부과 + 반납 처리 -------
  const applyPenaltyAndProcessReturn = async () => {
    if (!currentUser || penaltyPoints <= -1) {
      alert('벌점 정보를 입력해주세요.');
      return;
    }

    const finalReason =
      selectedPenaltyType === 'other'
        ? customReason
        : PENALTY_REASONS.find((r) => r.value === selectedPenaltyType)?.label || '사유 없음';

    if (!finalReason.trim()) {
      alert('벌점 사유를 입력해주세요.');
      return;
    }

    try {
      const rentalRef = doc(db, 'reservations', currentUser.rentalId);
      await updateDoc(rentalRef, {
        status: 'returned',
        returnedAt: serverTimestamp(),
        processedBy: admin.uid,
        returnStatus: 'damaged',
        penaltyPoints,
        penaltyReason: finalReason,
      });

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
              reason: finalReason,
              date: new Date(),
              rentalId: currentUser.rentalId,
              adminId: admin.uid,
            },
          ],
        });
      }

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
                description: finalReason,
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
      setSelectedPenaltyType('');
      setCustomReason('');
      setCurrentUser(null);
      setForceReturnMode(false);
      fetchRentalData();
      fetchAllUsers();
    } catch (e) {
      console.error('Error applying penalty:', e);
      alert('처리 중 오류가 발생했습니다.');
    }
  };

  const processSelectedReturns = async () => {
    if (selectedItems.length === 0) return alert('선택된 항목이 없습니다.');
    if (!confirm(`선택한 ${selectedItems.length}개 항목을 정상 반납 처리하시겠습니까?`))
      return;
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

  const toggleExpandUser = (id) => {
    setExpandedUsers((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const renderSortControls = () => (
    <div style={{ marginBottom: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontWeight: 'bold', color: '#424242' }}>정렬:</span>
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
            padding: '6px 12px',
            backgroundColor: sortBy === opt.key ? '#2196F3' : '#E0E0E0',
            color: sortBy === opt.key ? 'white' : 'black',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  const renderUserSortControls = () => (
    <div style={{ marginBottom: 15, display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ fontWeight: 'bold', color: '#424242' }}>정렬:</span>
      {[
        { key: 'name', label: '이름순' },
        { key: 'studentId', label: '학번순' },
        { key: 'penaltyPoints', label: '벌점순' },
        { key: 'rentalCount', label: '대여횟수순' },
      ].map((opt) => (
        <button
          key={opt.key}
          onClick={() => handleUserSortChange(opt.key)}
          style={{
            padding: '6px 12px',
            backgroundColor: userSortBy === opt.key ? '#2196F3' : '#E0E0E0',
            color: userSortBy === opt.key ? 'white' : 'black',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  const renderPenaltyModal = () => {
    if (!penaltyModalOpen) return null;
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 9999,
        }}
      >
        <div
          style={{
            backgroundColor: '#fff',
            padding: 30,
            borderRadius: 8,
            width: 500,
            maxWidth: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            color: '#000',
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: 20, color: '#e53935' }}>
            {forceReturnMode ? '강제 반납 처리' : '벌점 부과'}
          </h2>
          <p style={{ marginBottom: 20 }}>
            <strong>사용자:</strong> {currentUser?.name}
          </p>

          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
              벌점 사유 선택:
            </label>
            <select
              value={selectedPenaltyType}
              onChange={handlePenaltyTypeChange}
              style={{
                width: '100%',
                padding: 10,
                border: '1px solid #ccc',
                borderRadius: 4,
                fontSize: 14,
              }}
            >
              <option value="">-- 사유를 선택하세요 --</option>
              {PENALTY_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label} (기본 {reason.defaultPoints}점)
                </option>
              ))}
            </select>
          </div>

          {selectedPenaltyType === 'other' && (
            <div style={{ marginBottom: 15 }}>
              <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
                상세 사유 입력:
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: 8,
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  minHeight: 80,
                  fontSize: 14,
                }}
                placeholder="벌점 부과 사유를 자세히 입력해주세요."
              />
            </div>
          )}

          <div style={{ marginBottom: 15 }}>
            <label style={{ display: 'block', marginBottom: 5, fontWeight: 'bold' }}>
              벌점 (1-20점):
            </label>
            <input
              type="number"
              min="1"
              max="20"
              value={penaltyPoints}
              onChange={(e) => setPenaltyPoints(parseInt(e.target.value || '0', 10))}
              style={{
                width: '100%',
                padding: 8,
                border: '1px solid #ccc',
                borderRadius: 4,
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button
              onClick={() => {
                setPenaltyModalOpen(false);
                setForceReturnMode(false);
              }}
              style={{
                padding: '10px 20px',
                border: '1px solid #ccc',
                borderRadius: 4,
                backgroundColor: '#f5f5f5',
                cursor: 'pointer',
              }}
            >
              취소
            </button>
            <button
              onClick={applyPenaltyAndProcessReturn}
              style={{
                padding: '10px 20px',
                backgroundColor: '#e53935',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              {forceReturnMode ? '강제 반납 + 벌점 부과' : '벌점 부과 및 반납 처리'}
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
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {type === 'pending' && (
              <>
                <button
                  onClick={() => approveRental(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '6px 12px',
                    backgroundColor: '#4caf50',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 13,
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
                    padding: '6px 12px',
                    backgroundColor: '#f44336',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  <X size={16} />
                  거절
                </button>
              </>
            )}
            {type === 'active' && (
              <button
                onClick={() => openForceReturnModal(item)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  backgroundColor: '#ff5722',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 'bold',
                }}
              >
                <Ban size={16} />
                강제 반납
              </button>
            )}
            {type === 'return' && (
              <button
                onClick={() => processReturn(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '6px 12px',
                  backgroundColor: '#2196f3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
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
                  padding: '6px 12px',
                  backgroundColor: '#4caf50',
                  color: '#fff',
                  borderRadius: 4,
                  fontSize: 13,
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
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        {/* Expanded */}
        {isExpanded && (
          <div
            style={{
              padding: 15,
              backgroundColor: '#f9f9f9',
              borderRadius: 4,
              marginTop: 10,
              color: '#000',
            }}
          >
            {/* 유저 프로필 요약 카드 */}
            <div
              style={{
                backgroundColor: '#fff',
                padding: 20,
                borderRadius: 8,
                marginBottom: 20,
                border: '2px solid #1976d2',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <h4 style={{ margin: '0 0 15px 0', color: '#1976d2', fontSize: 18, fontWeight: 'bold' }}>
                사용자 프로필
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontSize: 13, color: '#666' }}>이름</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 'bold' }}>{item.userName || '이름 없음'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontSize: 13, color: '#666' }}>학번</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 'bold' }}>{item.userStudentId || '미입력'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontSize: 13, color: '#666' }}>연락처</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 'bold' }}>{item.userPhone || '미입력'}</p>
                </div>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontSize: 13, color: '#666' }}>이메일</p>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 'bold', wordBreak: 'break-all' }}>
                    {item.userEmail || '이메일 없음'}
                  </p>
                </div>
              </div>

              {/* 통계 정보 */}
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  paddingTop: 15,
                  borderTop: '1px solid #e0e0e0',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '10px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: 6,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, color: '#1976d2' }}>대여 이력</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: 20, fontWeight: 'bold', color: '#1565c0' }}>
                    {item.rentalCount || 0}회
                  </p>
                </div>
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '10px',
                    backgroundColor: item.userPenalty > 0 ? '#ffebee' : '#e8f5e9',
                    borderRadius: 6,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, color: item.userPenalty > 0 ? '#d32f2f' : '#2e7d32' }}>
                    누적 벌점
                  </p>
                  <p
                    style={{
                      margin: '5px 0 0 0',
                      fontSize: 20,
                      fontWeight: 'bold',
                      color: item.userPenalty > 0 ? '#c62828' : '#388e3c',
                    }}
                  >
                    {item.userPenalty || 0}점
                  </p>
                </div>
              </div>

              {/* 벌점 이력 표시 */}
              {item.userPenaltyHistory && item.userPenaltyHistory.length > 0 && (
                <div
                  style={{
                    marginTop: 15,
                    padding: 12,
                    backgroundColor: '#fff3e0',
                    borderRadius: 6,
                    border: '1px solid #ffb74d',
                  }}
                >
                  <h5 style={{ margin: '0 0 10px 0', color: '#e65100', fontSize: 14 }}>
                    최근 벌점 이력 (최근 3건)
                  </h5>
                  {item.userPenaltyHistory
                    .slice(-3)
                    .reverse()
                    .map((penalty, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: '8px 0',
                          borderBottom: idx < 2 ? '1px solid #ffe0b2' : 'none',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, color: '#d84315', fontWeight: 'bold' }}>
                            {penalty.points}점
                          </span>
                          <span style={{ fontSize: 12, color: '#666' }}>
                            {penalty.date?.toDate ? formatKoreanDateTime(penalty.date.toDate()) : '날짜 없음'}
                          </span>
                        </div>
                        <p style={{ margin: '3px 0 0 0', fontSize: 12, color: '#555' }}>{penalty.reason}</p>
                      </div>
                    ))}
                </div>
              )}

              {/* 서약서 링크 */}
              {item.userPledge && (
                <div style={{ marginTop: 15 }}>
                  <a
                    href={item.userPledge}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '8px 15px',
                      backgroundColor: '#1976d2',
                      color: '#fff',
                      textDecoration: 'none',
                      borderRadius: 6,
                      fontSize: 13,
                      fontWeight: 'bold',
                    }}
                  >
                    서약서 보기
                  </a>
                </div>
              )}
            </div>

            {/* 대여 일정 카드 */}
            <div
              style={{
                backgroundColor: '#fff',
                padding: 15,
                borderRadius: 6,
                marginBottom: 15,
                border: '1px solid #e0e0e0',
              }}
            >
              <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>대여 일정</h4>
              <p style={{ margin: '5px 0' }}>
                <strong>대여 시작:</strong> {formatKoreanDateTime(item.startDateTime)}
              </p>
              <p style={{ margin: '5px 0' }}>
                <strong>반납 예정:</strong> {formatKoreanDateTime(item.endDateTime)}
              </p>
              {type === 'completed' && item.returnedAt && (
                <p style={{ margin: '5px 0' }}>
                  <strong>실제 반납:</strong> {formatKoreanDateTime(item.returnedAt)}
                </p>
              )}
            </div>

            {/* 반납 상태 (완료 탭) */}
            {type === 'completed' && (
              <div
                style={{
                  backgroundColor: '#fff',
                  padding: 15,
                  borderRadius: 6,
                  marginBottom: 15,
                  border: '1px solid #e0e0e0',
                }}
              >
                <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>반납 상태</h4>
                <p style={{ margin: '5px 0' }}>
                  <strong>상태:</strong>{' '}
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
                      ? '문제 있음'
                      : item.returnStatus === 'late'
                      ? '연체'
                      : item.returnStatus}
                  </span>
                </p>
                {item.penaltyPoints > 0 && (
                  <p style={{ margin: '5px 0' }}>
                    <strong>부과 벌점:</strong>{' '}
                    <span style={{ color: '#e53935', fontWeight: 'bold', fontSize: 16 }}>
                      {item.penaltyPoints}점
                    </span>
                    {item.penaltyReason && (
                      <span style={{ marginLeft: 10, color: '#666' }}>
                        (사유: {item.penaltyReason})
                      </span>
                    )}
                  </p>
                )}
              </div>
            )}

            {/* 장비 목록 */}
            <div
              style={{
                backgroundColor: '#fff',
                padding: 15,
                borderRadius: 6,
                marginBottom: 15,
                border: '1px solid #e0e0e0',
              }}
            >
              <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>대여 장비</h4>
              {Array.isArray(item.items) && item.items.length > 0 ? (
                item.items.map((equip, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 15,
                      padding: 10,
                      backgroundColor: '#f5f5f5',
                      borderRadius: 4,
                      marginBottom: 10,
                    }}
                  >
                    {equip.imageURL ? (
                      <img
                        src={equip.imageURL || "/placeholder.svg"}
                        alt={equip.name}
                        style={{
                          width: 80,
                          height: 80,
                          objectFit: 'cover',
                          borderRadius: 4,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 80,
                          height: 80,
                          backgroundColor: '#E0E0E0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 4,
                          fontSize: 11,
                        }}
                      >
                        이미지 없음
                      </div>
                    )}
                    <div>
                      <p style={{ margin: 0, fontWeight: 'bold', fontSize: 15 }}>
                        {equip.name}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: '#999' }}>장비 정보 없음</p>
              )}
            </div>

            {/* 반납 이미지 */}
            {(type === 'completed' || type === 'return') && item.returnImageURL && (
              <div
                style={{
                  backgroundColor: '#fff',
                  padding: 15,
                  borderRadius: 6,
                  marginBottom: 15,
                  border: '1px solid #e0e0e0',
                }}
              >
                <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>반납 확인 사진</h4>
                <img
                  src={item.returnImageURL || "/placeholder.svg"}
                  alt="반납 이미지"
                  style={{ width: '100%', maxWidth: 500, borderRadius: 8, objectFit: 'cover' }}
                />
              </div>
            )}

            {/* 장기 대여자 표시 */}
            {item.long_imageURL && (
              <div
                style={{
                  backgroundColor: '#fff',
                  padding: 15,
                  borderRadius: 6,
                  marginBottom: 15,
                  border: '2px solid #fdd835',
                }}
              >
                <div
                  style={{
                    display: 'inline-block',
                    backgroundColor: '#fdd835',
                    color: '#000',
                    padding: '5px 12px',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 'bold',
                    marginBottom: 10,
                  }}
                >
                  장기 대여자
                </div>
                <img
                  src={item.long_imageURL || "/placeholder.svg"}
                  alt="장기 대여 이미지"
                  style={{ width: '100%', maxWidth: 500, borderRadius: 8, objectFit: 'cover' }}
                />
              </div>
            )}

            {/* 비고 */}
            {item.notes && (
              <div
                style={{
                  backgroundColor: '#fffde7',
                  padding: 15,
                  borderRadius: 6,
                  border: '1px solid #fff59d',
                }}
              >
                <h4 style={{ margin: '0 0 10px 0', color: '#f57f17' }}>추가 메모</h4>
                <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{item.notes}</p>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // ------- 유저 아이템 렌더링 -------
  const renderUserItem = (user) => {
    const isExpanded = expandedUsers[user.id] || false;
    return (
      <div
        key={user.id}
        style={{
          border: '1px solid #E0E0E0',
          borderRadius: 8,
          padding: 15,
          marginBottom: 15,
          backgroundColor: '#fff',
        }}
      >
        {/* Header line */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                backgroundColor: '#1976d2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
                fontSize: 20,
              }}
            >
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  margin: 0,
                  color: '#000',
                }}
                onClick={() => toggleExpandUser(user.id)}
              >
                {user.name || '이름 없음'}
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: 13, color: '#666' }}>
                {user.studentId || '학번 없음'} | {user.email || '이메일 없음'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
            {/* 벌점 배지 */}
            <div
              style={{
                padding: '6px 12px',
                backgroundColor: (user.penaltyPoints || 0) > 0 ? '#ffebee' : '#e8f5e9',
                color: (user.penaltyPoints || 0) > 0 ? '#c62828' : '#2e7d32',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 'bold',
              }}
            >
              벌점 {user.penaltyPoints || 0}점
            </div>
            {/* 대여 횟수 배지 */}
            <div
              style={{
                padding: '6px 12px',
                backgroundColor: '#e3f2fd',
                color: '#1565c0',
                borderRadius: 20,
                fontSize: 13,
                fontWeight: 'bold',
              }}
            >
              대여 {user.rentalCount || 0}회
            </div>
            <button
              onClick={() => toggleExpandUser(user.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: 5,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          </div>
        </div>

        {/* Expanded */}
        {isExpanded && (
          <div
            style={{
              padding: 15,
              backgroundColor: '#f9f9f9',
              borderRadius: 4,
              marginTop: 10,
              color: '#000',
            }}
          >
            {/* 유저 상세 정보 카드 */}
            <div
              style={{
                backgroundColor: '#fff',
                padding: 20,
                borderRadius: 8,
                marginBottom: 20,
                border: '2px solid #1976d2',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <h4 style={{ margin: '0 0 15px 0', color: '#1976d2', fontSize: 18, fontWeight: 'bold' }}>
                상세 정보
              </h4>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15, marginBottom: 15 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <User size={18} color="#666" />
                  <div>
                    <p style={{ margin: '0 0 3px 0', fontSize: 12, color: '#666' }}>이름</p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 'bold' }}>{user.name || '이름 없음'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <CreditCard size={18} color="#666" />
                  <div>
                    <p style={{ margin: '0 0 3px 0', fontSize: 12, color: '#666' }}>학번</p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 'bold' }}>{user.studentId || '미입력'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Phone size={18} color="#666" />
                  <div>
                    <p style={{ margin: '0 0 3px 0', fontSize: 12, color: '#666' }}>연락처</p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 'bold' }}>{user.phoneNumber || '미입력'}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Mail size={18} color="#666" />
                  <div>
                    <p style={{ margin: '0 0 3px 0', fontSize: 12, color: '#666' }}>이메일</p>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 'bold', wordBreak: 'break-all' }}>
                      {user.email || '이메일 없음'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 역할 정보 */}
              <div style={{ marginBottom: 15, paddingTop: 15, borderTop: '1px solid #e0e0e0' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: 12, color: '#666' }}>역할</p>
                <span
                  style={{
                    display: 'inline-block',
                    padding: '4px 10px',
                    backgroundColor: user.role === 'admin' ? '#fff3e0' : '#e3f2fd',
                    color: user.role === 'admin' ? '#e65100' : '#1565c0',
                    borderRadius: 4,
                    fontSize: 13,
                    fontWeight: 'bold',
                  }}
                >
                  {user.role === 'admin' ? '관리자' : '일반 사용자'}
                </span>
              </div>

              {/* 통계 정보 */}
              <div
                style={{
                  display: 'flex',
                  gap: 10,
                  paddingTop: 15,
                  borderTop: '1px solid #e0e0e0',
                }}
              >
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '10px',
                    backgroundColor: '#e3f2fd',
                    borderRadius: 6,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, color: '#1976d2' }}>총 대여 횟수</p>
                  <p style={{ margin: '5px 0 0 0', fontSize: 20, fontWeight: 'bold', color: '#1565c0' }}>
                    {user.rentalCount || 0}회
                  </p>
                </div>
                <div
                  style={{
                    flex: 1,
                    textAlign: 'center',
                    padding: '10px',
                    backgroundColor: (user.penaltyPoints || 0) > 0 ? '#ffebee' : '#e8f5e9',
                    borderRadius: 6,
                  }}
                >
                  <p style={{ margin: 0, fontSize: 12, color: (user.penaltyPoints || 0) > 0 ? '#d32f2f' : '#2e7d32' }}>
                    누적 벌점
                  </p>
                  <p
                    style={{
                      margin: '5px 0 0 0',
                      fontSize: 20,
                      fontWeight: 'bold',
                      color: (user.penaltyPoints || 0) > 0 ? '#c62828' : '#388e3c',
                    }}
                  >
                    {user.penaltyPoints || 0}점
                  </p>
                </div>
              </div>
            </div>

            {/* 벌점 이력 */}
            {user.penaltyHistory && user.penaltyHistory.length > 0 && (
              <div
                style={{
                  backgroundColor: '#fff',
                  padding: 20,
                  borderRadius: 8,
                  marginBottom: 20,
                  border: '1px solid #ffb74d',
                }}
              >
                <h4 style={{ margin: '0 0 15px 0', color: '#e65100', fontSize: 16, fontWeight: 'bold' }}>
                  벌점 이력 (총 {user.penaltyHistory.length}건)
                </h4>
                {user.penaltyHistory
                  .slice()
                  .reverse()
                  .map((penalty, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '12px',
                        backgroundColor: '#fff3e0',
                        borderRadius: 6,
                        marginBottom: idx < user.penaltyHistory.length - 1 ? 10 : 0,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 15, color: '#d84315', fontWeight: 'bold' }}>
                          {penalty.points}점
                        </span>
                        <span style={{ fontSize: 12, color: '#666' }}>
                          {penalty.date?.toDate ? formatKoreanDateTime(penalty.date.toDate()) : 
                           penalty.date instanceof Date ? formatKoreanDateTime(penalty.date) : '날짜 없음'}
                        </span>
                      </div>
                      <p style={{ margin: '8px 0 0 0', fontSize: 13, color: '#555' }}>{penalty.reason}</p>
                    </div>
                  ))}
              </div>
            )}

            {/* 서약서 */}
            {user.pledgeFileURL && (
              <div
                style={{
                  backgroundColor: '#fff',
                  padding: 20,
                  borderRadius: 8,
                  border: '1px solid #e0e0e0',
                }}
              >
                <h4 style={{ margin: '0 0 15px 0', color: '#1976d2', fontSize: 16, fontWeight: 'bold' }}>
                  서약서
                </h4>
                <a
                  href={user.pledgeFileURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 20px',
                    backgroundColor: '#1976d2',
                    color: '#fff',
                    textDecoration: 'none',
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 'bold',
                  }}
                >
                  <FileText size={18} />
                  서약서 보기
                </a>
              </div>
            )}
            {/* 개별 유저 벌점 초기화 */}
<div style={{ marginTop: 15, paddingTop: 15, borderTop: '1px solid #e0e0e0' }}>
  <button
    onClick={async () => {
      if (!window.confirm(`${user.name || '해당 유저'}의 벌점을 초기화하시겠습니까?`)) return;
      try {
        await updateDoc(doc(db, 'user_profiles', user.id), {
          penaltyPoints: 0,
          penaltyHistory: [],
        });
        alert('벌점이 초기화되었습니다.');
        fetchAllUsers();
      } catch (e) {
        console.error(e);
        alert('초기화 중 오류가 발생했습니다.');
      }
    }}
    style={{
      padding: '8px 16px',
      backgroundColor: '#e53935',
      color: '#fff',
      border: 'none',
      borderRadius: 6,
      cursor: 'pointer',
      fontSize: 13,
      fontWeight: 'bold',
    }}
  >
    벌점 초기화
  </button>
</div>
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 15,
              color: '#000',
            }}
          >
            <h3 style={{ margin: 0 }}>대기 중인 신청 ({pendingRentals.length})</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => toggleSelectAll(pendingRentals)}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#E0E0E0',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                {selectedItems.length === pendingRentals.length && pendingRentals.length > 0
                  ? '전체 해제'
                  : '전체 선택'}
              </button>
              <button
                onClick={approveSelectedRentals}
                disabled={selectedItems.length === 0}
                style={{
                  padding: '8px 15px',
                  backgroundColor: selectedItems.length > 0 ? '#4caf50' : '#E0E0E0',
                  color: selectedItems.length > 0 ? 'white' : '#9E9E9E',
                  border: 'none',
                  borderRadius: 4,
                  cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                }}
              >
                선택 항목 승인
              </button>
              <button
                onClick={rejectSelectedRentals}
                disabled={selectedItems.length === 0}
                style={{
                  padding: '8px 15px',
                  backgroundColor: selectedItems.length > 0 ? '#f44336' : '#E0E0E0',
                  color: selectedItems.length > 0 ? 'white' : '#9E9E9E',
                  border: 'none',
                  borderRadius: 4,
                  cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: 13,
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 15,
            }}
          >
            <h3 style={{ margin: 0 }}>반납 요청 ({returnRequests.length})</h3>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => toggleSelectAll(returnRequests)}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#E0E0E0',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
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
                  padding: '8px 15px',
                  backgroundColor: selectedItems.length > 0 ? '#2196f3' : '#E0E0E0',
                  color: selectedItems.length > 0 ? 'white' : '#9E9E9E',
                  border: 'none',
                  borderRadius: 4,
                  cursor: selectedItems.length > 0 ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                }}
              >
                선택 항목 일괄 정상 반납
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

    if (activeTab === 'users') {
      return (
        <>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 15,
              color: '#000',
              flexWrap: 'wrap',
              gap: 15,
            }}
          >
            <h3 style={{ margin: 0 }}>전체 유저 ({allUsers.length}명)</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ position: 'relative' }}>
                <Search
                  size={18}
                  style={{
                    position: 'absolute',
                    left: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#666',
                  }}
                />
                <input
                  type="text"
                  placeholder="이름, 학번, 이메일, 연락처 검색..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  style={{
                    padding: '8px 15px 8px 35px',
                    border: '1px solid #E0E0E0',
                    borderRadius: 4,
                    fontSize: 14,
                    width: 280,
                  }}
                />
              </div>
              <button
                onClick={fetchAllUsers}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '8px 15px',
                  backgroundColor: '#1976d2',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 4,
                  cursor: 'pointer',
                  fontSize: 13,
                }}
              >
                <RefreshCw size={16} />
                새로고침
              </button>
            </div>
            <button
  onClick={async () => {
    if (!window.confirm('모든 유저의 벌점을 초기화하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) return;
    try {
      const batch = writeBatch(db);
      allUsers.forEach((user) => {
        batch.update(doc(db, 'user_profiles', user.id), {
          penaltyPoints: 0,
          penaltyHistory: [],
        });
      });
      await batch.commit();
      alert(`${allUsers.length}명의 벌점이 초기화되었습니다.`);
      fetchAllUsers();
    } catch (e) {
      console.error(e);
      alert('전체 초기화 중 오류가 발생했습니다.');
    }
  }}
  style={{
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '8px 15px',
    backgroundColor: '#e53935',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 'bold',
  }}
>
  전체 벌점 초기화
</button>
          </div>
          {renderUserSortControls()}
          {filteredUsers.length > 0 ? (
            filteredUsers.map((user) => renderUserItem(user))
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
              <p>{userSearchTerm ? '검색 결과가 없습니다.' : '등록된 유저가 없습니다.'}</p>
            </div>
          )}
        </>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
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
          <span style={{ fontSize: 12 }}>홈</span>
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
          <span style={{ fontSize: 12 }}>캘린더</span>
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
          <span style={{ fontSize: 12 }}>장비관리</span>
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
          <span style={{ fontSize: 12 }}>예약</span>
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
          <span style={{ fontSize: 12 }}>스프레드시트</span>
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
          <span style={{ fontSize: 12 }}>설정</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: 20, borderBottom: '1px solid #E0E0E0', flexWrap: 'wrap' }}>
        {[
          { key: 'pending', label: '대여 신청 관리' },
          { key: 'active', label: '대여 중인 장비' },
          { key: 'return', label: '반납 요청 관리' },
          { key: 'completed', label: '반납 완료' },
          { key: 'users', label: '유저 관리', icon: Users },
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
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            {t.icon && <t.icon size={16} />}
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ backgroundColor: '#fff', padding: 20, borderRadius: 8 }}>
        {renderTabContent()}
      </div>

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
