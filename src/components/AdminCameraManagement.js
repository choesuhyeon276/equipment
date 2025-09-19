import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc,
  getDoc 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../firebase/firebaseConfig';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify';

const processImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const maxWidth = 800;
        const maxHeight = 600;
        let width = img.width * 0.8;
        let height = img.height * 0.8;
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;
        ctx.drawImage(img, x, y, width, height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 240 && data[i+1] > 240 && data[i+2] > 240) {
            data[i+3] = 0;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { type: 'image/png', lastModified: Date.now() }));
        }, 'image/png');
      };
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

const AdminEquipmentManagement = () => {
  const [equipments, setEquipments] = useState([]);
  const [newEquipment, setNewEquipment] = useState({
    name: '',
    category: '',
    brand: '',
    issues: '',
    purpose: '',
    displayOrder: 0,
    status: 'available',
    condition: '정상',
    dailyRentalPrice: '',
    image: '',
    batteryModel: '',
    mountType: '',
    recommendSDCard: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [internalImageFiles, setInternalImageFiles] = useState([]); // 배열로 변경
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [scrollContainer, setScrollContainer] = useState(null);

  // 카테고리별 displayOrder 범위 정의
  const CATEGORY_ORDER_RANGES = {
    'Camera': { start: 0, end: 100 },
    'Lens': { start: 101, end: 200 },
    'Lighting': { start: 201, end: 300 },
    'Battery': { start: 301, end: 400 },
    'Sound': { start: 401, end: 500 },
    'VR device': { start: 501, end: 600 },
    'ETC': { start: 601, end: 700 }
  };

  // 카테고리별로 다음 displayOrder를 계산하는 함수
  const getNextDisplayOrder = (category, existingEquipments = []) => {
    const range = CATEGORY_ORDER_RANGES[category];
    if (!range) return 601; // ETC 기본값
    
    // 해당 카테고리의 기존 장비들의 displayOrder 찾기
    const categoryEquipments = existingEquipments.filter(eq => eq.category === category);
    const existingOrders = categoryEquipments.map(eq => eq.displayOrder || range.start).filter(order => order >= range.start && order <= range.end);
    
    if (existingOrders.length === 0) {
      return range.start;
    }
    
    // 가장 큰 displayOrder + 1 반환 (범위 내에서)
    const maxOrder = Math.max(...existingOrders);
    return Math.min(maxOrder + 1, range.end);
  };

  // 카테고리별 그룹핑 및 구분선을 위한 함수
  const groupEquipmentsByCategory = (equipments) => {
    const categoryOrder = ['Camera', 'Lens', 'Lighting', 'Battery', 'Sound', 'VR device', 'ETC'];
    const grouped = {};
    
    // 카테고리별로 그룹핑
    equipments.forEach(equipment => {
      const category = equipment.category || 'ETC';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(equipment);
    });
    
    // 각 카테고리 내에서 displayOrder로 정렬
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => {
        const range = CATEGORY_ORDER_RANGES[category] || CATEGORY_ORDER_RANGES['ETC'];
        const orderA = a.displayOrder ?? range.start;
        const orderB = b.displayOrder ?? range.start;
        return orderA - orderB;
      });
    });
    
    return grouped;
  };

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'user_profiles', user.uid);
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.role !== 'admin') {
              toast.warn('관리자 권한이 없습니다.');
              window.location.href = '/main';
            } else {
              fetchEquipments();
            }
          } else {
            toast.warn('사용자 정보가 존재하지 않습니다.');
            window.location.href = '/main';
          }
        } catch (error) {
          console.error('관리자 권한 확인 중 오류:', error);
          toast.warn('인증 확인 중 오류가 발생했습니다.');
          window.location.href = '/main';
        }
      } else {
        toast.warn('로그인이 필요합니다.');
        window.location.href = '/login';
      }
    });
    return () => unsubscribe();
  }, []);

  const fetchEquipments = async () => {
    try {
      const equipmentCollection = collection(db, 'cameras');
      const snapshot = await getDocs(equipmentCollection);
      const equipmentList = snapshot.docs.map(d => ({
        id: d.id, 
        ...d.data()
      }));
      
      // 전체적으로 정렬 (카테고리별 범위 고려)
      equipmentList.sort((a, b) => {
        const rangeA = CATEGORY_ORDER_RANGES[a.category] || CATEGORY_ORDER_RANGES['ETC'];
        const rangeB = CATEGORY_ORDER_RANGES[b.category] || CATEGORY_ORDER_RANGES['ETC'];
        const orderA = a.displayOrder ?? rangeA.start;
        const orderB = b.displayOrder ?? rangeB.start;
        return orderA - orderB;
      });
      
      setEquipments(equipmentList);
    } catch (error) {
      console.error("장비 목록 불러오기 중 오류:", error);
      toast.warn('장비 목록을 불러오는 중 오류가 발생했습니다.');
    }
  };

  // 카테고리가 변경될 때 displayOrder 자동 설정
  const handleCategoryChange = (category) => {
    const nextOrder = getNextDisplayOrder(category, equipments);
    setNewEquipment({
      ...newEquipment, 
      category,
      displayOrder: nextOrder
    });
  };

  // 수정된 handleImageUpload 함수 - 내부사진은 원본 화질로 업로드
  const handleImageUpload = async (file, folder = 'camera-images', isInternal = false) => {
    if (!file) return null;
    try {
      // 내부사진이 아닌 경우에만 processImage 적용
      const fileToUpload = isInternal ? file : await processImage(file);
      
      const uniqueFileName = `${Date.now()}_${fileToUpload.name}`;
      const storageRef = ref(storage, `${folder}/${uniqueFileName}`);
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(fileToUpload.type)) {
        toast.warn('지원되지 않는 파일 형식입니다. JPEG, PNG, GIF 파일만 업로드 가능합니다.');
        return null;
      }
      const maxSize = 10 * 1024 * 1024; // 내부사진을 위해 10MB로 증가
      if (fileToUpload.size > maxSize) {
        toast.warn('파일 크기가 너무 큽니다. 10MB 이하의 파일만 업로드 가능합니다.');
        return null;
      }
      const snapshot = await uploadBytes(storageRef, fileToUpload);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { downloadURL, storageRef };
    } catch (error) {
      console.error("이미지 업로드 중 오류:", error);
      toast.warn('이미지 업로드에 실패했습니다.');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = null;
      let internalImageUrl = null;

      // 메인 이미지 업로드 (기존과 동일 - 압축됨)
      if (imageFile) {
        const uploadResult = await handleImageUpload(imageFile, 'camera-images', false);
        if (uploadResult) {
          imageUrl = uploadResult.downloadURL;
          if (editingEquipment && editingEquipment.imageURL) {
            try {
              const existingImageRef = ref(storage, editingEquipment.imageURL);
              await deleteObject(existingImageRef);
            } catch (deleteError) {
              console.error("기존 이미지 삭제 중 오류:", deleteError);
            }
          }
        } else {
          return;
        }
      } else if (editingEquipment) {
        imageUrl = editingEquipment.imageURL;
      }

      // 내부사진 업로드 (여러 장, 원본 화질 유지)
      let internalImageUrls = [];
      if (internalImageFiles && internalImageFiles.length > 0) {
        for (const file of internalImageFiles) {
          const uploadResult = await handleImageUpload(file, 'camera-internal-images', true);
          if (uploadResult) {
            internalImageUrls.push(uploadResult.downloadURL);
          }
        }
        
        // 기존 내부사진들 삭제
        if (editingEquipment && editingEquipment.internalImageURLs && editingEquipment.internalImageURLs.length > 0) {
          for (const url of editingEquipment.internalImageURLs) {
            try {
              const existingImageRef = ref(storage, url);
              await deleteObject(existingImageRef);
            } catch (deleteError) {
              console.error("기존 내부사진 삭제 중 오류:", deleteError);
            }
          }
        }
      } else if (editingEquipment) {
        internalImageUrls = editingEquipment.internalImageURLs || [];
      }

      // displayOrder 유효성 검사
      let finalDisplayOrder = parseInt(newEquipment.displayOrder) || 0;
      const range = CATEGORY_ORDER_RANGES[newEquipment.category] || CATEGORY_ORDER_RANGES['ETC'];
      if (finalDisplayOrder < range.start || finalDisplayOrder > range.end) {
        finalDisplayOrder = getNextDisplayOrder(newEquipment.category, equipments);
        toast.info(`displayOrder가 범위를 벗어나 자동으로 ${finalDisplayOrder}로 설정되었습니다.`);
      }

      const equipmentData = {
        ...newEquipment,
        displayOrder: finalDisplayOrder,
        imageURL: imageUrl || (editingEquipment ? editingEquipment.imageURL : ''),
        internalImageURLs: internalImageUrls, // 배열로 저장
        createdAt: editingEquipment ? editingEquipment.createdAt : new Date()
      };

      if (editingEquipment) {
        await updateDoc(doc(db, 'cameras', editingEquipment.id), equipmentData);
        setEditingEquipment(null);
        toast.success('장비가 수정되었습니다!');
      } else {
        await addDoc(collection(db, 'cameras'), equipmentData);
        toast.success('장비가 추가되었습니다!');
      }

      fetchEquipments();
      setNewEquipment({
        name: '',
        category: '',
        brand: '',
        issues: '',
        purpose: '',
        displayOrder: 0,
        status: 'available',
        condition: '정상',
        dailyRentalPrice: '',
        image: '',
        batteryModel: '',
        mountType: '',
        recommendSDCard: ''
      });
      setImageFile(null);
      setInternalImageFiles([]); // 배열 초기화
    } catch (error) {
      console.error("장비 추가/수정 중 오류:", error);
      toast.error('장비 추가/수정 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (equipment) => {
    try {
      if (equipment.imageURL) {
        const imageRef = ref(storage, equipment.imageURL);
        await deleteObject(imageRef);
      }
      // 여러 내부사진 삭제
      if (equipment.internalImageURLs && equipment.internalImageURLs.length > 0) {
        for (const url of equipment.internalImageURLs) {
          try {
            const internalImageRef = ref(storage, url);
            await deleteObject(internalImageRef);
          } catch (deleteError) {
            console.error("내부사진 삭제 중 오류:", deleteError);
          }
        }
      }
      await deleteDoc(doc(db, 'cameras', equipment.id));
      fetchEquipments();
      toast.success('장비가 삭제되었습니다!');
    } catch (error) {
      console.error("장비 삭제 중 오류:", error);
      toast.error('장비 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = (equipment) => {
    setEditingEquipment(equipment);
    const range = CATEGORY_ORDER_RANGES[equipment.category] || CATEGORY_ORDER_RANGES['ETC'];
    setNewEquipment({
      name: equipment.name,
      category: equipment.category,
      brand: equipment.brand || '',
      issues: equipment.issues || '',
      purpose: equipment.purpose || '',
      displayOrder: equipment.displayOrder || range.start,
      status: equipment.status || 'available',
      condition: equipment.condition || '정상',
      dailyRentalPrice: equipment.dailyRentalPrice || '',
      imageURL: equipment.imageURL || '',
      internalImageURLs: equipment.internalImageURLs || [], // 배열로 처리
      batteryModel: equipment.batteryModel || '',
      mountType: equipment.mountType || '',
      recommendSDCard: equipment.recommendSDCard || ''
    });
    setInternalImageFiles([]); // 새 파일 선택을 위해 초기화
  };

  // 자동 스크롤 함수
  const autoScroll = (e) => {
    if (!scrollContainer) return;
    
    const containerRect = scrollContainer.getBoundingClientRect();
    const scrollThreshold = 100;
    const scrollSpeed = 10;
    
    if (e.clientY < containerRect.top + scrollThreshold) {
      // 위로 스크롤
      scrollContainer.scrollTop -= scrollSpeed;
    } else if (e.clientY > containerRect.bottom - scrollThreshold) {
      // 아래로 스크롤
      scrollContainer.scrollTop += scrollSpeed;
    }
  };

  // 드래그 앤 드롭 관련 함수들
  const handleDragStart = (e, equipment, categoryIndex, itemIndex) => {
    setDraggedItem({ equipment, categoryIndex, itemIndex });
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, categoryIndex, itemIndex) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex({ categoryIndex, itemIndex });
    autoScroll(e); // 자동 스크롤 추가
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e, targetCategoryIndex, targetItemIndex) => {
    e.preventDefault();
    
    if (!draggedItem || 
        (draggedItem.categoryIndex === targetCategoryIndex && draggedItem.itemIndex === targetItemIndex)) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    const groupedEquipments = groupEquipmentsByCategory(equipments);
    const categoryOrder = ['Camera', 'Lens', 'Lighting', 'Battery', 'Sound', 'VR device', 'ETC'];
    const targetCategory = categoryOrder[targetCategoryIndex];
    const sourceCategory = categoryOrder[draggedItem.categoryIndex];
    
    // 카테고리 내에서만 이동 허용
    if (sourceCategory !== targetCategory) {
      toast.warn('같은 카테고리 내에서만 순서 변경이 가능합니다.');
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }
    
    const categoryEquipments = [...groupedEquipments[targetCategory]];
    const [draggedEquipment] = categoryEquipments.splice(draggedItem.itemIndex, 1);
    categoryEquipments.splice(targetItemIndex, 0, draggedEquipment);
    
    // displayOrder 재계산
    const range = CATEGORY_ORDER_RANGES[targetCategory];
    const updatedEquipments = categoryEquipments.map((equipment, index) => ({
      ...equipment,
      displayOrder: range.start + index
    }));
    
    // 전체 장비 목록 업데이트
    const newEquipments = [...equipments];
    updatedEquipments.forEach(updatedEquip => {
      const index = newEquipments.findIndex(eq => eq.id === updatedEquip.id);
      if (index !== -1) {
        newEquipments[index] = updatedEquip;
      }
    });
    
    setEquipments(newEquipments);
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const saveOrder = async () => {
    try {
      const groupedEquipments = groupEquipmentsByCategory(equipments);
      const updatePromises = [];
      
      Object.entries(groupedEquipments).forEach(([category, categoryEquipments]) => {
        const range = CATEGORY_ORDER_RANGES[category] || CATEGORY_ORDER_RANGES['ETC'];
        categoryEquipments.forEach((equipment, index) => {
          const newDisplayOrder = range.start + index;
          updatePromises.push(
            updateDoc(doc(db, 'cameras', equipment.id), { displayOrder: newDisplayOrder })
          );
        });
      });
      
      await Promise.all(updatePromises);
      toast.success('순서가 저장되었습니다!');
      fetchEquipments(); // 새로고침
    } catch (error) {
      console.error("순서 저장 중 오류:", error);
      toast.error('순서 저장 중 오류가 발생했습니다.');
    }
  };

  // 카테고리별로 그룹핑된 장비들을 렌더링하는 함수
  const renderGroupedEquipments = () => {
    const groupedEquipments = groupEquipmentsByCategory(equipments);
    const categoryOrder = ['Camera', 'Lens', 'Lighting', 'Battery', 'Sound', 'VR device', 'ETC'];
    const categoryNames = {
      'Camera': '📷 카메라',
      'Lens': '🔍 렌즈',
      'Lighting': '💡 조명 장비',
      'Battery': '🔋 배터리',
      'Sound': '🎤 음향 장비',
      'VR device': '🥽 VR 장비',
      'ETC': '📦 기타'
    };
    
    return categoryOrder.map((category, categoryIndex) => {
      if (!groupedEquipments[category] || groupedEquipments[category].length === 0) {
        return null;
      }
      
      const categoryEquipments = groupedEquipments[category];
      const range = CATEGORY_ORDER_RANGES[category];
      
      return (
        <div key={category} style={{ marginBottom: '40px' }}>
          {/* 카테고리 구분선 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            margin: '20px 0',
            gridColumn: '1 / -1'
          }}>
            <div style={{
              backgroundColor: '#333',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '20px',
              fontWeight: 'bold',
              fontSize: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {categoryNames[category]} ({categoryEquipments.length})
              <span style={{ fontSize: '12px', opacity: 0.8 }}>
                ({range.start}-{range.end})
              </span>
            </div>
            <div style={{
              flex: 1,
              height: '2px',
              backgroundColor: '#333',
              marginLeft: '15px'
            }}></div>
          </div>
          
          {/* 해당 카테고리의 장비들 */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)', // 3x3에서 4x4로 변경
            gap: '15px' // gap도 줄여서 더 많이 보이게
          }}>
            {categoryEquipments.map((equipment, itemIndex) => {
              const isDragOver = dragOverIndex && 
                dragOverIndex.categoryIndex === categoryIndex && 
                dragOverIndex.itemIndex === itemIndex;
              
              return (
                <div 
                  key={equipment.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, equipment, categoryIndex, itemIndex)}
                  onDragOver={(e) => handleDragOver(e, categoryIndex, itemIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, categoryIndex, itemIndex)}
                  style={{
                    border: isDragOver ? '2px solid #4CAF50' : '1px solid #333',
                    borderRadius: '8px', // 조금 더 둥글게
                    padding: '12px', // 패딩 줄여서 컴팩트하게
                    textAlign: 'center',
                    backgroundColor: 'white',
                    cursor: 'grab',
                    position: 'relative',
                    transform: isDragOver ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.2s ease',
                    fontSize: '13px' // 폰트 크기 줄여서 더 많이 보이게
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '3px',
                    left: '3px',
                    backgroundColor: '#666',
                    color: 'white',
                    borderRadius: '50%',
                    width: '20px',
                    height: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10px',
                    fontWeight: 'bold'
                  }}>
                    {equipment.displayOrder || range.start}
                  </div>

                  {/* 카테고리 뱃지 */}
                  <div style={{
                    position: 'absolute',
                    top: '3px',
                    right: '3px',
                    backgroundColor: '#e3f2fd',
                    color: '#1976d2',
                    padding: '1px 6px',
                    borderRadius: '10px',
                    fontSize: '9px',
                    fontWeight: 'bold'
                  }}>
                    {category}
                  </div>

                  {equipment.imageURL && (
                    <img 
                      src={equipment.imageURL}
                      alt={equipment.name}
                      style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '6px', marginBottom: '8px', marginTop: '15px' }}
                    />
                  )}
                  <h3 style={{ fontSize: '14px', margin: '8px 0', lineHeight: '1.2' }}>{equipment.name}</h3>
                  <p style={{ fontSize: '12px', margin: '3px 0' }}>브랜드: {equipment.brand || '미입력'}</p>
                  <p style={{ color: 'black', fontSize: '12px', margin: '3px 0' }}>장비 특이사항: {equipment.issues || '미입력'}</p>
                  <p style={{ color: 'black', fontSize: '12px', margin: '3px 0' }}>장비 상태: {equipment.condition}</p>

                  {/* 내부사진 여부 표시 */}
                  {equipment.internalImageURLs && equipment.internalImageURLs.length > 0 && (
                    <div style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                      backgroundColor: '#e8f4fd',
                      padding: '2px 6px',
                      borderRadius: '8px',
                      fontSize: '10px',
                      color: '#1976d2',
                      marginBottom: '8px'
                    }}>
                      <span style={{ color: '#1976d2', fontWeight: 'bold' }}>📷</span>
                      내부사진 ({equipment.internalImageURLs.length}장)
                    </div>
                  )}

                  <div style={{ marginTop: '8px', fontSize: '11px' }}>
                    {equipment.batteryModel && <p style={{ margin: '2px 0' }}>배터리: {equipment.batteryModel}</p>}
                    {equipment.mountType && <p style={{ margin: '2px 0' }}>마운트: {equipment.mountType}</p>}
                    {equipment.recommendSDCard && <p style={{ margin: '2px 0' }}>SD카드: {equipment.recommendSDCard}</p>}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', gap: '6px', marginTop: '10px' }}>
                    <button
                      onClick={() => handleEdit(equipment)}
                      style={{ padding: '4px 8px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDelete(equipment)}
                      style={{ padding: '4px 8px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '10px' }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  return (
    <div style={{
      fontFamily: 'Pretendard, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      backgroundColor: 'white',
      color: 'black',
      display: 'flex'
    }}>
      {/* 왼쪽: 등록/수정 폼 */}
      <div style={{ width: '40%', marginRight: '20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px', borderBottom: '2px solid black' }}>
          장비 관리 페이지
        </h1>
        <div 
          style={{
            display: 'grid',
            gap: '15px',
            marginBottom: '30px'
          }}
        >
          <input
            type="text"
            placeholder="장비 이름"
            value={newEquipment.name}
            onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
            required
            style={{ padding: '10px', border: '1px solid #333', borderRadius: '5px' }}
          />

          <select
            value={newEquipment.category}
            onChange={(e) => handleCategoryChange(e.target.value)}
            required
            style={{ padding: '10px', border: '1px solid #333', borderRadius: '5px' }}
          >
            <option value="">장비 카테고리 선택</option>
            <option value="Camera">카메라 (0-100)</option>
            <option value="Lens">렌즈 (101-200)</option>
            <option value="Lighting">조명 장비 (201-300)</option>
            <option value="Battery">배터리 (301-400)</option>
            <option value="Sound">음향 장비 (401-500)</option>
            <option value="VR device">VR 장비 (501-600)</option>
            <option value="ETC">기타 (601-700)</option>
          </select>

          <input
            type="text"
            placeholder="브랜드"
            value={newEquipment.brand}
            onChange={(e) => setNewEquipment({...newEquipment, brand: e.target.value})}
            style={{ padding: '10px', border: '1px solid #333', borderRadius: '5px' }}
          />

          <textarea
            placeholder="장비 특이사항"
            value={newEquipment.issues}
            onChange={(e) => setNewEquipment({...newEquipment, issues: e.target.value})}
            style={{ padding: '10px', border: '1px solid #333', borderRadius: '5px' }}
          />

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <input
              type="number"
              placeholder="표시 순서"
              value={newEquipment.displayOrder}
              onChange={(e) => setNewEquipment({...newEquipment, displayOrder: e.target.value})}
              style={{ padding: '10px', border: '1px solid #333', borderRadius: '5px', flex: 1 }}
              min={newEquipment.category ? CATEGORY_ORDER_RANGES[newEquipment.category]?.start : 0}
              max={newEquipment.category ? CATEGORY_ORDER_RANGES[newEquipment.category]?.end : 999}
            />
            {newEquipment.category && (
              <span style={{ fontSize: '12px', color: '#666' }}>
                {CATEGORY_ORDER_RANGES[newEquipment.category]?.start}-{CATEGORY_ORDER_RANGES[newEquipment.category]?.end}
              </span>
            )}
          </div>

          <select
            value={newEquipment.status}
            onChange={(e) => setNewEquipment({...newEquipment, status: e.target.value})}
            style={{
              padding: '10px',
              border: '1px solid #333',
              borderRadius: '5px',
              backgroundColor: 'white',
              color: 'black'
            }}
          >
            <option value="available">대여 가능</option>
            <option value="rented">수리 중</option>
          </select>

          <select
            value={newEquipment.condition}
            onChange={(e) => setNewEquipment({...newEquipment, condition: e.target.value})}
            style={{
              padding: '10px',
              border: '1px solid #333',
              borderRadius: '5px',
              backgroundColor: 'white',
              color: 'black'
            }}
          >
            <option value="정상">정상</option>
            <option value="주의">주의</option>
            <option value="수리">수리</option>
          </select>

          <input
            type="text"
            placeholder="배터리 모델"
            value={newEquipment.batteryModel}
            onChange={(e) => setNewEquipment({...newEquipment, batteryModel: e.target.value})}
            style={{ padding: '10px', border: '1px solid #333', borderRadius: '5px' }}
          />
          
          <input
            type="text"
            placeholder="마운트 타입"
            value={newEquipment.mountType}
            onChange={(e) => setNewEquipment({...newEquipment, mountType: e.target.value})}
            style={{ padding: '10px', border: '1px solid #333', borderRadius: '5px' }}
          />
          
          <input
            type="text"
            placeholder="추천sd카드"
            value={newEquipment.recommendSDCard}
            onChange={(e) => setNewEquipment({...newEquipment, recommendSDCard: e.target.value})}
            style={{ padding: '10px', border: '1px solid #333', borderRadius: '5px' }}
          />

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>메인 이미지 (압축됨)</label>
            <input
              type="file"
              onChange={(e) => setImageFile(e.target.files[0])}
              style={{ padding: '10px', border: '1px solid #333', borderRadius: '5px', width: '100%' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>내부사진 (원본 화질, 여러 장 가능)</label>
            <input
              type="file"
              multiple
              onChange={(e) => setInternalImageFiles(Array.from(e.target.files))}
              style={{ padding: '10px', border: '1px solid #333', borderRadius: '5px', width: '100%' }}
            />
            <small style={{ fontSize: '12px', color: '#666' }}>
              여러 장 선택 가능 (Ctrl/Cmd 클릭), 원본 화질로 저장됩니다 (각각 최대 10MB)
            </small>
            {internalImageFiles.length > 0 && (
              <div style={{ marginTop: '5px', fontSize: '12px', color: '#333' }}>
                선택된 파일: {internalImageFiles.length}장
              </div>
            )}
            {editingEquipment && editingEquipment.internalImageURLs && editingEquipment.internalImageURLs.length > 0 && (
              <div style={{ marginTop: '5px', fontSize: '12px', color: '#666' }}>
                기존 내부사진: {editingEquipment.internalImageURLs.length}장 (새 파일 선택 시 교체됨)
              </div>
            )}
          </div>

          <button 
            onClick={handleSubmit}
            style={{ padding: '10px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            {editingEquipment ? '장비 수정' : '장비 추가'}
          </button>
        </div>
      </div>

      {/* 오른쪽: 카테고리별 장비 리스트 */}
      <div style={{ width: '60%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '20px', borderBottom: '2px solid black', margin: 0 }}>
            장비 목록 (카테고리별)
          </h2>
          <button
            onClick={saveOrder}
            style={{
              padding: '10px 20px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            순서 저장
          </button>
        </div>
        
        <div 
          ref={setScrollContainer}
          style={{
            maxHeight: '800px',
            overflowY: 'auto',
            paddingRight: '10px'
          }}
        >
          {renderGroupedEquipments()}
        </div>
      </div>
    </div>
  );
};

export default AdminEquipmentManagement;