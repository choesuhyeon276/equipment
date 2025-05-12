// src/components/reservation/components/DateTimeSelector.jsx
import React, { useState } from 'react';
import { Calendar, Clock, ChevronDown } from 'lucide-react';

const DateTimeSelector = ({
  isMobile,
  rentalDate,
  rentalTime,
  returnDate,
  returnTime,
  minReturnDate,
  maxReturnDate,
  timeOptions,
  returnTimeOptions,
  handleRentalDateChange,
  setRentalTime,
  setReturnDate,
  setReturnTime
}) => {
  // 모바일에서만 사용할 상태값들
  const [showRentalDatePicker, setShowRentalDatePicker] = useState(false);
  const [showRentalTimePicker, setShowRentalTimePicker] = useState(false);
  const [showReturnDatePicker, setShowReturnDatePicker] = useState(false);
  const [showReturnTimePicker, setShowReturnTimePicker] = useState(false);
  
  // 날짜를 예쁘게 포맷팅하는 함수
  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '날짜 선택';
    
    const [year, month, day] = dateString.split('-');
    return `${month}/${day}`;
  };
  
  // 현재 날짜로부터 향후 14일의 날짜 생성 (날짜 선택용)
  const generateDates = (startDateStr, maxDays = 8) => {
    const dates = [];
    const startDate = startDateStr ? new Date(startDateStr) : new Date();
    
    for (let i = 0; i < maxDays; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      const formatted = `${year}-${month}-${day}`;
      const displayDate = `${month}/${day}`;
      const dayName = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
      
      dates.push({
        value: formatted,
        display: displayDate,
        dayName: dayName
      });
    }
    
    return dates;
  };
  
  // 모바일 스타일 새로운 디자인 (검정 계열로 변경)
  if (isMobile) {
    const rentalDates = generateDates(null, 14);
    const returnDates = generateDates(rentalDate || null, 8);
    
    return (
      <div style={{
        width: '100%',
        marginBottom: '15px',
      }}>
        {/* 세련된 모바일 스타일의 날짜/시간 선택기 (다크 테마) */}
        <div style={{
          display: 'flex',
          background: 'linear-gradient(135deg, #222, #444)',
          borderRadius: '12px',
          overflow: 'hidden',
          boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
          marginBottom: '5px'
        }}>
          {/* 대여 날짜/시간 */}
          <div style={{
            flex: 1,
            padding: '12px',
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            borderRight: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '5px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Calendar size={14} style={{ marginRight: '4px' }} />
              대여
            </div>
            
            <div style={{
              display: 'flex',
              gap: '5px'
            }}>
              {/* 날짜 선택 버튼 */}
              <div 
                onClick={() => setShowRentalDatePicker(!showRentalDatePicker)} 
                style={{
                  flex: 2,
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                {formatDateForDisplay(rentalDate)}
                <ChevronDown size={14} />
              </div>
              
              {/* 시간 선택 버튼 */}
              <div 
                onClick={() => setShowRentalTimePicker(!showRentalTimePicker)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                {rentalTime}
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
          
          {/* 반납 날짜/시간 */}
          <div style={{
            flex: 1,
            padding: '12px',
            color: 'white',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              marginBottom: '5px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Calendar size={14} style={{ marginRight: '4px' }} />
              반납
            </div>
            
            <div style={{
              display: 'flex',
              gap: '5px'
            }}>
              {/* 날짜 선택 버튼 */}
              <div 
                onClick={() => setShowReturnDatePicker(!showReturnDatePicker)}
                style={{
                  flex: 2,
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '11px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                {formatDateForDisplay(returnDate)}
                <ChevronDown size={14} />
              </div>
              
              {/* 시간 선택 버튼 */}
              <div 
                onClick={() => setShowReturnTimePicker(!showReturnTimePicker)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '6px',
                  padding: '8px 10px',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                {returnTime}
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
        </div>
        
        {/* 대여 날짜 선택기 드롭다운 */}
        {showRentalDatePicker && (
          <div style={{
            background: '#222',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            padding: '10px',
            marginBottom: '10px',
            animation: 'slideDown 0.2s ease-out'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px'
            }}>
              {rentalDates.map((date) => (
                <div 
                  key={date.value}
                  onClick={() => {
                    handleRentalDateChange(date.value);
                    setShowRentalDatePicker(false);
                  }}
                  style={{
                    background: rentalDate === date.value ? '#555' : '#333',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '8px 0',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    border: rentalDate === date.value ? '1px solid #888' : '1px solid transparent'
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{date.display}</div>
                  <div style={{ fontSize: '11px', marginTop: '2px', color: '#aaa' }}>{date.dayName}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 대여 시간 선택기 드롭다운 */}
        {showRentalTimePicker && (
          <div style={{
            background: '#222',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            padding: '10px',
            marginBottom: '10px',
            animation: 'slideDown 0.2s ease-out'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px'
            }}>
              {timeOptions.map((time) => (
                <div 
                  key={time}
                  onClick={() => {
                    setRentalTime(time);
                    setShowRentalTimePicker(false);
                  }}
                  style={{
                    background: rentalTime === time ? '#555' : '#333',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '10px 0',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '14px',
                    border: rentalTime === time ? '1px solid #888' : '1px solid transparent'
                  }}
                >
                  {time}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 반납 날짜 선택기 드롭다운 */}
        {showReturnDatePicker && (
          <div style={{
            background: '#222',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            padding: '10px',
            marginBottom: '10px',
            animation: 'slideDown 0.2s ease-out'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px'
            }}>
              {returnDates.map((date) => (
                <div 
                  key={date.value}
                  onClick={() => {
                    if (!(minReturnDate && new Date(date.value) < new Date(minReturnDate))) {
                      setReturnDate(date.value);
                      setShowReturnDatePicker(false);
                    }
                  }}
                  style={{
                    background: returnDate === date.value ? '#555' : '#333',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '8px 0',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    opacity: minReturnDate && new Date(date.value) < new Date(minReturnDate) ? 0.3 : 1,
                    border: returnDate === date.value ? '1px solid #888' : '1px solid transparent'
                  }}
                >
                  <div style={{ fontWeight: '600', fontSize: '14px' }}>{date.display}</div>
                  <div style={{ fontSize: '11px', marginTop: '2px', color: '#aaa' }}>{date.dayName}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 반납 시간 선택기 드롭다운 */}
        {showReturnTimePicker && (
          <div style={{
            background: '#222',
            borderRadius: '10px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
            padding: '10px',
            marginBottom: '10px',
            animation: 'slideDown 0.2s ease-out'
          }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: '8px',
              maxHeight: '200px',
              overflowY: 'auto'
            }}>
              {returnTimeOptions.map((time) => (
                <div 
                  key={time}
                  onClick={() => {
                    setReturnTime(time);
                    setShowReturnTimePicker(false);
                  }}
                  style={{
                    background: returnTime === time ? '#555' : '#333',
                    color: 'white',
                    borderRadius: '8px',
                    padding: '10px 0',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontSize: '14px',
                    border: returnTime === time ? '1px solid #888' : '1px solid transparent'
                  }}
                >
                  {time}
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* 추가 스타일 */}
        <style>
          {`
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}
        </style>
      </div>
    );
  }

  // 데스크탑 버전은 기존 레이아웃 유지
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: '20px',
      alignItems: 'center',
      gap: '0'
    }}>
      {/* Rental and Return Date */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        gap: '10px',
        width: 'auto'
      }}>
        <div style={{ 
          fontSize: '18px', 
          fontWeight: 'bold',
          minWidth: '100px',
          marginBottom: '0'
        }}>대여일자</div>
        <input
          type="date"
          value={rentalDate}
          onChange={(e) => handleRentalDateChange(e.target.value)}
          style={{
            padding: '10px',
            width: 'auto',
            height: '40px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '5px'
          }}
        />

        <select
          value={rentalTime}
          onChange={(e) => setRentalTime(e.target.value)}
          style={{
            padding: '10px',
            width: '100px',
            height: '40px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '5px'
          }}
        >
          {timeOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        <div style={{ 
          fontSize: '18px', 
          fontWeight: 'bold',
          minWidth: '100px',
          marginLeft: '20px',
          marginTop: '0',
          marginBottom: '0'
        }}>반납일자</div>
        <input
          type="date"
          value={returnDate}
          onChange={(e) => setReturnDate(e.target.value)}
          min={minReturnDate}
          max={maxReturnDate}
          style={{
            padding: '10px',
            width: 'auto',
            height: '40px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '5px'
          }}
        />

        <select
          value={returnTime}
          onChange={(e) => setReturnTime(e.target.value)}
          style={{
            padding: '10px',
            width: '100px',
            height: '40px',
            fontSize: '16px',
            border: '1px solid #ccc',
            borderRadius: '5px'
          }}
        >
          {returnTimeOptions.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default DateTimeSelector;