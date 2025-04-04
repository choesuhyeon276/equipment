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

const processImage = (file) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();
    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 고정된 최대 크기 설정 (예: 800x600)
        const maxWidth = 800;
        const maxHeight = 600;
        
        // 비율 유지하며 크기 조정
        let width = img.width * 0.8;
        let height = img.height * 0.8;
        
        // 최대 크기 제한
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
        
        // 캔버스 크기 설정
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 흰색 배경 채우기
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 이미지를 중앙에 70% 크기로 그리기
        const x = (canvas.width - width) / 2;
        const y = (canvas.height - height) / 2;
        
        ctx.drawImage(img, x, y, width, height);
        
        // 이미지 데이터 가져오기
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // 흰색에 가까운 픽셀 처리
        for (let i = 0; i < data.length; i += 4) {
          if (
            data[i] > 240 && 
            data[i+1] > 240 && 
            data[i+2] > 240
          ) {
            data[i+3] = 0; // 투명도 조절
          }
        }
        
        // 수정된 이미지 데이터 다시 그리기
        ctx.putImageData(imageData, 0, 0);
        
        // Base64로 변환
        canvas.toBlob((blob) => {
          resolve(new File([blob], file.name, { 
            type: 'image/png',
            lastModified: Date.now()
          }));
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
    description: '',
    status: 'available',
    condition: '정상',
    dailyRentalPrice: '',
    image: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [editingEquipment, setEditingEquipment] = useState(null);
 
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
              alert('관리자 권한이 없습니다.');
              window.location.href = '/main'; // 일반 유저는 메인으로 이동
            } else {
              fetchEquipments(); // ✅ 관리자만 장비 데이터 조회
            }
          } else {
            alert('사용자 정보가 존재하지 않습니다.');
            window.location.href = '/main';
          }
        } catch (error) {
          console.error('관리자 권한 확인 중 오류:', error);
          alert('인증 확인 중 오류가 발생했습니다.');
          window.location.href = '/main';
        }
      } else {
        alert('로그인이 필요합니다.');
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
      setEquipments(equipmentList);
    } catch (error) {
      console.error("장비 목록 불러오기 중 오류:", error);
      alert('장비 목록을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return null;
    try {
      // 이미지 전처리
      const processedFile = await processImage(imageFile);
      
      const uniqueFileName = `${Date.now()}_${processedFile.name}`;
      const storageRef = ref(storage, `camera-images/${uniqueFileName}`);
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(processedFile.type)) {
        alert('지원되지 않는 파일 형식입니다. JPEG, PNG, GIF 파일만 업로드 가능합니다.');
        return null;
      }
      
      const maxSize = 5 * 1024 * 1024;
      if (processedFile.size > maxSize) {
        alert('파일 크기가 너무 큽니다. 5MB 이하의 파일만 업로드 가능합니다.');
        return null;
      }
      
      const snapshot = await uploadBytes(storageRef, processedFile);
      const downloadURL = await getDownloadURL(snapshot.ref);
      return { downloadURL, storageRef };
    } catch (error) {
      console.error("이미지 업로드 중 오류:", error);
      alert('이미지 업로드에 실패했습니다.');
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      let imageUrl = null;
  
if (imageFile) {
  const uploadResult = await handleImageUpload();
  if (uploadResult) {
    imageUrl = uploadResult.downloadURL;
    
    // 기존 이미지가 있으면 삭제
    if (editingEquipment && editingEquipment.imageURL) {
      try {
        const existingImageRef = ref(storage, editingEquipment.image);
        await deleteObject(existingImageRef);
      } catch (deleteError) {
        console.error("기존 이미지 삭제 중 오류:", deleteError);
      }
    }
  } else {
    return; // 이미지 업로드 실패 시 함수 종료
  }
} else if (editingEquipment) {
  // 수정 모드이고 새 이미지가 없으면 기존 이미지 유지
  imageUrl = editingEquipment.image;
}

      const equipmentData = {
        ...newEquipment,
        imageURL: imageUrl || (editingEquipment ? editingEquipment.image : ''),
        createdAt: editingEquipment ? editingEquipment.createdAt : new Date()
      };

      if (editingEquipment) {
        await updateDoc(doc(db, 'cameras', editingEquipment.id), equipmentData);
        setEditingEquipment(null);
      } else {
        await addDoc(collection(db, 'cameras'), equipmentData);
      }

      fetchEquipments();
      
      // Reset form
      setNewEquipment({
        name: '',
        category: '',
        brand: '',
        issues: '',
        purpose: '',
        description: '',
        status: 'available',
        condition: '정상',
        dailyRentalPrice: '',
        image: ''
      });
      setImageFile(null);
    } catch (error) {
      console.error("장비 추가/수정 중 오류:", error);
      alert('장비 추가/수정 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (equipment) => {
    try {
      if (equipment.imageURL) {
        const imageRef = ref(storage, equipment.imageURL);
        await deleteObject(imageRef);
      }
      
      await deleteDoc(doc(db, 'cameras', equipment.id));
      fetchEquipments();
    } catch (error) {
      console.error("장비 삭제 중 오류:", error);
      alert('장비 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleEdit = (equipment) => {
    setEditingEquipment(equipment);
    setNewEquipment({
      name: equipment.name,
      category: equipment.category,
      brand: equipment.brand || '',
      issues: equipment.issues || '',
      purpose: equipment.purpose || '',
      description: equipment.description || '',
      status: equipment.status || 'available',
      condition: equipment.condition || '정상',
      dailyRentalPrice: equipment.dailyRentalPrice || '',
      imageURL: equipment.imageURL || ''
    });
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
      <div style={{ width: '40%', marginRight: '20px' }}>
        <h1 style={{ 
          fontSize: '24px', 
          marginBottom: '20px', 
          borderBottom: '2px solid black',
          color: 'black' 
        }}>
          장비 관리 페이지
        </h1>

        <form 
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gap: '15px',
            marginBottom: '30px',
            color: 'black'
          }}
        >
          <input
            type="text"
            placeholder="장비 이름"
            value={newEquipment.name}
            onChange={(e) => setNewEquipment({...newEquipment, name: e.target.value})}
            style={{
              padding: '10px',
              border: '1px solid #333',
              borderRadius: '5px',
              backgroundColor: 'white',
              color: 'black'
            }}
            required
          />
          
          <select
            value={newEquipment.category}
            onChange={(e) => setNewEquipment({...newEquipment, category: e.target.value})}
            style={{
              padding: '10px',
              border: '1px solid #333',
              borderRadius: '5px',
              backgroundColor: 'white',
              color: 'black'
            }}
            required
          >
            <option value="">장비 카테고리 선택</option>
            <option value="Filming">필름 장비</option>
            <option value="Lighting">조명 장비</option>
            <option value="Battery">배터리</option>
            <option value="Sound">음향 장비</option>
            <option value="VR device">VR 장비</option>
            <option value="ETC">기타</option>
          </select>

          <input
            type="text"
            placeholder="브랜드"
            value={newEquipment.brand}
            onChange={(e) => setNewEquipment({...newEquipment, brand: e.target.value})}
            style={{
              padding: '10px',
              border: '1px solid #333',
              borderRadius: '5px',
              backgroundColor: 'white',
              color: 'black'
            }}
          />

          <textarea
            placeholder="장비 특이사항"
            value={newEquipment.issues}
            onChange={(e) => setNewEquipment({...newEquipment, issues: e.target.value})}
            style={{
              padding: '10px',
              border: '1px solid #333',
              borderRadius: '5px',
              minHeight: '100px',
              backgroundColor: 'white',
              color: 'black'
            }}
          />

          <textarea
            placeholder="장비 설명"
            value={newEquipment.description}
            onChange={(e) => setNewEquipment({...newEquipment, description: e.target.value})}
            style={{
              padding: '10px',
              border: '1px solid #333',
              borderRadius: '5px',
              minHeight: '100px',
              backgroundColor: 'white',
              color: 'black'
            }}
          />

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
            <option value="rented">대여 중</option>
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
            type="file"
            onChange={(e) => setImageFile(e.target.files[0])}
            style={{
              padding: '10px',
              border: '1px solid #333',
              borderRadius: '5px',
              backgroundColor: 'white',
              color: 'black'
            }}
          />

          <button 
            type="submit"
            style={{
              padding: '10px',
              backgroundColor: '#333',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            {editingEquipment ? '장비 수정' : '장비 추가'}
          </button>
        </form>
      </div>

      <div style={{ width: '60%' }}>
        <h2 style={{ 
          fontSize: '20px', 
          marginBottom: '20px', 
          borderBottom: '2px solid black',
          color: 'black' 
        }}>
          장비 목록
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '20px',
          color: 'black',
          maxHeight: '600px',
          overflowY: 'auto'
        }}>
          {equipments.map((equipment) => (
            <div 
              key={equipment.id}
              style={{
                border: '1px solid #333',
                borderRadius: '10px',
                padding: '15px',
                textAlign: 'center',
                backgroundColor: 'white'
              }}
            >
              {equipment.imageURL && (
                <img 
                  src={equipment.imageURL} 
                  alt={equipment.name}
                  style={{
                    width: '100%',
                    height: '200px',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    marginBottom: '10px'
                  }}
                />
              )}
              <h3 style={{ marginBottom: '10px', color: 'black' }}>{equipment.name}</h3>
              <p style={{ color: 'black' }}>카테고리: {equipment.category}</p>
              <p style={{ color: 'black' }}>상태: {equipment.status === 'available' ? '대여 가능' : '대여 중'}</p>
              <p style={{ color: 'black' }}>브랜드: {equipment.brand || '미입력'}</p>
              <p style={{ color: 'black' }}>장비 특이사항: {equipment.issues || '미입력'}</p>
              <p style={{ color: 'black' }}>장비 상태: {equipment.condition}</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => handleEdit(equipment)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#333',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(equipment)}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: 'red',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminEquipmentManagement;