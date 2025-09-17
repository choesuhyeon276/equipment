import React, { useState } from 'react';
import { collection, getDocs, writeBatch, deleteField } from 'firebase/firestore';
import { db } from '../firebase/firebaseConfig';
import { toast } from 'react-toastify';

const DataOrganizer = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const analyzeData = async () => {
    setIsProcessing(true);
    try {
      console.log('🎥 데이터 분석 시작...');
      
      // 1. 모든 카메라 데이터 가져오기
      const snapshot = await getDocs(collection(db, 'cameras'));
      
      if (snapshot.empty) {
        toast.warn('카메라 데이터가 없습니다.');
        setIsProcessing(false);
        return;
      }
      
      // 2. description 있는 것만 수집
      const cameras = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.description !== undefined && data.description !== '') {
          const desc = parseFloat(data.description);
          if (!isNaN(desc)) {
            cameras.push({
              id: doc.id,
              docRef: doc.ref,
              name: data.name || 'Unknown',
              category: data.category || 'Unknown',
              originalDesc: data.description,
              numericDesc: desc,
              scaledValue: Math.round(desc * 10)
            });
          }
        }
      });
      
      if (cameras.length === 0) {
        toast.warn('처리할 수 있는 description 필드가 없습니다.');
        setIsProcessing(false);
        return;
      }
      
      // 3. 정렬
      cameras.sort((a, b) => a.scaledValue - b.scaledValue);
      
      // 4. displayOrder 할당
      const processedData = cameras.map((cam, index) => ({
        ...cam,
        newDisplayOrder: index + 1
      }));
      
      setPreviewData(processedData);
      setShowPreview(true);
      toast.success(`${cameras.length}개 카메라 분석 완료!`);
      
    } catch (error) {
      console.error('분석 오류:', error);
      toast.error('데이터 분석 중 오류가 발생했습니다.');
    }
    setIsProcessing(false);
  };

  const executeUpdate = async () => {
    if (previewData.length === 0) return;
    
    setIsProcessing(true);
    try {
      console.log('⚡ 업데이트 시작...');
      
      // Firestore batch 사용
      const batch = writeBatch(db);
      
      previewData.forEach(cam => {
        batch.update(cam.docRef, {
          displayOrder: cam.newDisplayOrder,
          description: deleteField() // description 필드 삭제
        });
      });
      
      await batch.commit();
      
      toast.success('🎉 업데이트 완료!');
      console.log('✅ 모든 데이터 업데이트 완료');
      
      // 미리보기 초기화
      setPreviewData([]);
      setShowPreview(false);
      
    } catch (error) {
      console.error('업데이트 오류:', error);
      toast.error('업데이트 중 오류가 발생했습니다.');
    }
    setIsProcessing(false);
  };

  return (
    <div style={{
      fontFamily: 'Pretendard, sans-serif',
      maxWidth: '800px',
      margin: '50px auto',
      padding: '30px',
      backgroundColor: 'white',
      borderRadius: '15px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
    }}>
      <h1 style={{ 
        fontSize: '28px', 
        marginBottom: '20px', 
        textAlign: 'center',
        color: '#333'
      }}>
        🎥 Camera Data Organizer
      </h1>
      
      <div style={{
        backgroundColor: '#fff3cd',
        border: '1px solid #ffeaa7',
        borderRadius: '10px',
        padding: '20px',
        marginBottom: '20px'
      }}>
        <h3 style={{ color: '#856404', marginTop: 0 }}>⚠️ 작업 내용</h3>
        <ul style={{ color: '#856404', marginBottom: 0 }}>
          <li><strong>description</strong> 값을 <strong>displayOrder</strong>로 변환</li>
          <li><strong>description</strong> 필드 완전 삭제</li>
          <li>10배 스케일링 후 1부터 순차 정렬</li>
        </ul>
        <p style={{ color: '#d63384', fontWeight: 'bold', marginBottom: 0, marginTop: '10px' }}>
          이 작업은 되돌릴 수 없습니다!
        </p>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button
          onClick={analyzeData}
          disabled={isProcessing}
          style={{
            padding: '12px 24px',
            backgroundColor: isProcessing ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: isProcessing ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isProcessing ? '⏳ 분석 중...' : '🔍 데이터 분석'}
        </button>
        
        {showPreview && (
          <button
            onClick={executeUpdate}
            disabled={isProcessing}
            style={{
              padding: '12px 24px',
              backgroundColor: isProcessing ? '#ccc' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: isProcessing ? 'not-allowed' : 'pointer'
            }}
          >
            {isProcessing ? '⚡ 실행 중...' : '⚡ 실행하기'}
          </button>
        )}
      </div>

      {showPreview && (
        <div style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #dee2e6',
          borderRadius: '10px',
          padding: '20px'
        }}>
          <h3 style={{ color: '#333', marginBottom: '15px' }}>
            📋 변경 예정 ({previewData.length}개)
          </h3>
          
          <div style={{
            maxHeight: '400px',
            overflowY: 'auto',
            fontSize: '14px'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#e9ecef' }}>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>순서</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>카테고리</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>이름</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>description</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>→ displayOrder</th>
                </tr>
              </thead>
              <tbody>
                {previewData.map((cam, index) => (
                  <tr key={cam.id} style={{ backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa' }}>
                    <td style={{ padding: '8px', border: '1px solid #ddd', textAlign: 'center' }}>
                      {cam.newDisplayOrder}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {cam.category}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {cam.name}
                    </td>
                    <td style={{ 
                      padding: '8px', 
                      border: '1px solid #ddd', 
                      textAlign: 'center',
                      color: '#dc3545',
                      textDecoration: 'line-through'
                    }}>
                      {cam.originalDesc}
                    </td>
                    <td style={{ 
                      padding: '8px', 
                      border: '1px solid #ddd', 
                      textAlign: 'center',
                      color: '#28a745',
                      fontWeight: 'bold'
                    }}>
                      {cam.newDisplayOrder}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataOrganizer;