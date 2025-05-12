// src/pages/MyPage/hooks/useUserData.jsx
import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { getItemImagesUrls } from '../utils/imageUtils';

/**
 * 사용자 데이터를 가져오는 훅
 * @param {Object} db - Firebase Firestore 데이터베이스 객체
 * @param {string} userId - 사용자 ID
 * @returns {Object} - 사용자 데이터와 대여 정보
 */
const useUserData = (db, userId) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userProfile, setUserProfile] = useState({});
  const [currentRentals, setCurrentRentals] = useState([]);
  const [pendingRentals, setPendingRentals] = useState([]);
  const [returnRequestedRentals, setReturnRequestedRentals] = useState([]);
  const [rentalHistory, setRentalHistory] = useState([]);
  const [imageUrls, setImageUrls] = useState({});
  const [penaltyPoints, setPenaltyPoints] = useState(0);
  const [agreementSubmitted, setAgreementSubmitted] = useState(false);
  const [agreementURL, setAgreementURL] = useState('');

  // 사용자 데이터 로드 함수
  const fetchUserData = async () => {
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
        
        if (profileData.agreementURL) {
          setAgreementURL(profileData.agreementURL);
        }
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
  
      // 대여 번호 매핑
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
        const urls = getItemImagesUrls(allItems);
        setImageUrls(urls);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching user data:', error);
      setError(error);
      setLoading(false);
    }
  };

  // userId가 변경될 때 데이터 로드
  useEffect(() => {
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  return {
    loading,
    error,
    userProfile,
    currentRentals,
    pendingRentals,
    returnRequestedRentals,
    rentalHistory,
    imageUrls,
    penaltyPoints,
    agreementSubmitted,
    agreementURL,
    fetchUserData
  };
};

export default useUserData;