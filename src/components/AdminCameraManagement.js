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
    description: '',
    status: 'available',
    condition: '정상',
    dailyRentalPrice: '',
    image: '',
    batteryModel: '',
    mountType: '',
    recommendSDCard: ''
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
      setEquipments(equipmentList);
    } catch (error) {
      console.error("장비 목록 불러오기 중 오류:", error);
      toast.warn('장비 목록을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleImageUpload = async () => {
    if (!imageFile) return null;
    try {
      const processedFile = await processImage(imageFile);
      const uniqueFileName = `${Date.now()}_${processedFile.name}`;
      const storageRef = ref(storage, `camera-images/${uniqueFileName}`);
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(processedFile.type)) {
        toast.warn('지원되지 않는 파일 형식입니다. JPEG, PNG, GIF 파일만 업로드 가능합니다.');
        return null;
      }
      const maxSize = 5 * 1024 * 1024;
      if (processedFile.size > maxSize) {
        toast.warn('파일 크기가 너무 큽니다. 5MB 이하의 파일만 업로드 가능합니다.');
        return null;
      }
      const snapshot = await uploadBytes(storageRef, processedFile);
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
      if (imageFile) {
        const uploadResult = await handleImageUpload();
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

      const equipmentData = {
        ...newEquipment,
        description: newEquipment.description === '' ? '' : parseFloat(newEquipment.description),
        imageURL: imageUrl || (editingEquipment ? editingEquipment.imageURL : ''),
        createdAt: editingEquipment ? editingEquipment.createdAt : new Date()
      };

      if (editingEquipment) {
        await updateDoc(doc(db, 'cameras', editingEquipment.id), equipmentData);
        setEditingEquipment(null);
      } else {
        await addDoc(collection(db, 'cameras'), equipmentData);
      }

      fetchEquipments();
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
        image: '',
        batteryModel: '',
        mountType: '',
        recommendSDCard: ''
      });
      setImageFile(null);
    } catch (error) {
      console.error("장비 추가/수정 중 오류:", error);
      toast.warn('장비 추가/수정 중 오류가 발생했습니다.');
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
      toast.warn('장비 삭제 중 오류가 발생했습니다.');
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
      imageURL: equipment.imageURL || '',
      batteryModel: equipment.batteryModel || '',
      mountType: equipment.mountType || '',
      recommendSDCard: equipment.recommendSDCard || ''
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
      {/* 왼쪽: 등록/수정 폼 */}
      <div style={{ width: '40%', marginRight: '20px' }}>
        <h1 style={{ fontSize: '24px', marginBottom: '20px', borderBottom: '2px solid black' }}>
          장비 관리 페이지
        </h1>
        <form 
          onSubmit={handleSubmit}
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
            onChange={(e) => setNewEquipment({...newEquipment, category: e.target.value})}
            required
            style={{ padding: '10px', border: '1px solid #333', borderRadius: '5px' }}
          >
            <option value="">장비 카테고리 선택</option>
            <option value="Camera">카메라</option>
            <option value="Lens">렌즈</option>
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
            style={{ padding: '10px', border: '1px solid #333', borderRadius: '5px' }}
          />

          <textarea
            placeholder="장비 특이사항"
            value={newEquipment.issues}
            onChange={(e) => setNewEquipment({...newEquipment, issues: e.target.value})}
            style={{ padding: '10px', border: '1px solid #333', borderRadius: '5px', }}
          />

          <textarea
            placeholder="장비 순서"
            value={newEquipment.description}
            onChange={(e) => setNewEquipment({...newEquipment, description: e.target.value})}
            style={{ padding: '10px', border: '1px solid #333', borderRadius: '5px', minHeight: '20px' }}
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


          {/* ✅ 태그 A/B/C 입력칸 */}
          <input
            type="text"
            placeholder="배터리 모델"
            value={newEquipment.batteryModel}
            onChange={(e) => setNewEquipment({...newEquipment, batteryModel: e.target.value})}
            style={{ padding: '10px', border: '1px solid #333', borderRadius: '5px', minHeight: '20px' }}
          />
          <input
            type="text"
            placeholder="마운트 타입"
            value={newEquipment.mountType}
            onChange={(e) => setNewEquipment({...newEquipment, mountType: e.target.value})}
            style={{ padding: '10px', border: '1px solid #333', borderRadius: '5px', minHeight: '20px' }}
          />
          <input
            type="text"
            placeholder="추천sd카드"
            value={newEquipment.recommendSDCard}
            onChange={(e) => setNewEquipment({...newEquipment, recommendSDCard: e.target.value})}
            style={{ padding: '10px', border: '1px solid #333', borderRadius: '5px', minHeight: '20px' }}
          />

          <input
            type="file"
            onChange={(e) => setImageFile(e.target.files[0])}
            style={{ padding: '10px', border: '1px solid #333', borderRadius: '5px' }}
          />

          <button 
            type="submit"
            style={{ padding: '10px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
          >
            {editingEquipment ? '장비 수정' : '장비 추가'}
          </button>
        </form>
      </div>

      {/* 오른쪽: 장비 리스트 */}
      <div style={{ width: '60%' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '20px', borderBottom: '2px solid black' }}>
          장비 목록
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '20px',
          maxHeight: '800px',
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
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '10px', marginBottom: '10px' }}
                />
              )}
              <h3>{equipment.name}</h3>
              <p>카테고리: {equipment.category}</p>
              <p>브랜드: {equipment.brand || '미입력'}</p>
              <p style={{ color: 'black' }}>장비 특이사항: {equipment.issues || '미입력'}</p>
              <p style={{ color: 'black' }}>장비 상태: {equipment.condition}</p>

              {/* ✅ 태그 A, B, C 보여주기 */}
              <div style={{ marginTop: '10px' }}>
                {equipment.batteryModel && <p>배터리 모델: {equipment.batteryModel}</p>}
                {equipment.mountType && <p>마운트 타입: {equipment.mountType}</p>}
                {equipment.recommendSDCard && <p>추천 sd카드: {equipment.recommendSDCard}</p>}
              </div>

              {/* 수정/삭제 버튼 */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                <button
                  onClick={() => handleEdit(equipment)}
                  style={{ padding: '5px 10px', backgroundColor: '#333', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
                >
                  수정
                </button>
                <button
                  onClick={() => handleDelete(equipment)}
                  style={{ padding: '5px 10px', backgroundColor: 'red', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
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
