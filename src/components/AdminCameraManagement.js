import React, { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from '../firebase/firebaseConfig';

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
    purpose: '',
    description: '',
    status: 'available',
    condition: '좋음',
    dailyRentalPrice: '',
    image: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [editingEquipment, setEditingEquipment] = useState(null);

  useEffect(() => {
    fetchEquipments();
  }, []);

  const fetchEquipments = async () => {
    const equipmentCollection = collection(db, 'cameras');
    const snapshot = await getDocs(equipmentCollection);
    const equipmentList = snapshot.docs.map(d => ({
      id: d.id, 
      ...d.data()
    }));
    setEquipments(equipmentList);
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
      
      // 새 이미지가 선택되었거나 편집 중인 장비에 이미지가 없는 경우
      if (imageFile || (editingEquipment && !editingEquipment.image)) {
        const uploadResult = await handleImageUpload();
        
        // 이미지 업로드 실패 시 알림
        if (!uploadResult) {
          return;
        }
        
        imageUrl = uploadResult.downloadURL;
        
        // 기존 이미지가 있다면 삭제
        if (editingEquipment && editingEquipment.image) {
          try {
            const existingImageRef = ref(storage, editingEquipment.image);
            await deleteObject(existingImageRef);
          } catch (deleteError) {
            console.error("기존 이미지 삭제 중 오류:", deleteError);
          }
        }
      }

      const equipmentData = {
        ...newEquipment,
        image: imageUrl || (editingEquipment ? editingEquipment.image : ''),
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
        purpose: '',
        description: '',
        status: 'available',
        condition: '좋음',
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
      // 이미지가 있다면 스토리지에서도 삭제
      if (equipment.image) {
        const imageRef = ref(storage, equipment.image);
        await deleteObject(imageRef);
      }
      
      // Firestore에서 문서 삭제
      await deleteDoc(doc(db, 'cameras', equipment.id));
      fetchEquipments();
    } catch (error) {
      console.error("장비 삭제 중 오류:", error);
    }
  };

  const handleEdit = (equipment) => {
    setEditingEquipment(equipment);
    setNewEquipment({
      name: equipment.name,
      category: equipment.category,
      brand: equipment.brand || '',
      purpose: equipment.purpose || '',
      description: equipment.description || '',
      status: equipment.status || 'available',
      condition: equipment.condition || '좋음',
      dailyRentalPrice: equipment.dailyRentalPrice || '',
      image: equipment.image || ''
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

          <input
            type="text"
            placeholder="사용 용도"
            value={newEquipment.purpose}
            onChange={(e) => setNewEquipment({...newEquipment, purpose: e.target.value})}
            style={{
              padding: '10px',
              border: '1px solid #333',
              borderRadius: '5px',
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
            <option value="좋음">좋음</option>
            <option value="최상">최상</option>
            <option value="양호">양호</option>
          </select>

          <input
            type="text"
            placeholder="일일 대여 가격 (원)"
            value={newEquipment.dailyRentalPrice}
            onChange={(e) => setNewEquipment({...newEquipment, dailyRentalPrice: e.target.value})}
            style={{
              padding: '10px',
              border: '1px solid #333',
              borderRadius: '5px',
              backgroundColor: 'white',
              color: 'black'
            }}
          />

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
              {equipment.image && (
                <img 
                  src={equipment.image} 
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
              <p style={{ color: 'black' }}>사용 용도: {equipment.purpose || '미입력'}</p>
              <p style={{ color: 'black' }}>일일 대여료: {equipment.dailyRentalPrice || '미입력'}</p>
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