import React, { useState } from 'react';

const ReservationMainPage = () => {
  const [rentalDate, setRentalDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [rentalTime, setRentalTime] = useState('09:00');
  const [returnTime, setReturnTime] = useState('09:30');

  const generateTimeOptions = () => {
    const options = [];
    let hour = 9;
    let minute = 0;
    while (hour < 17 || (hour === 17 && minute === 0)) {
      const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
      options.push(time);
      minute += 30;
      if (minute === 60) {
        minute = 0;
        hour++;
      }
    }
    return options;
  };

  const timeOptions = generateTimeOptions();

  return (
    <div style={{
      position: 'relative',
      width: '1440px',
      height: '1830px',
      background: '#FFFFFF',
      margin: '0 auto',
      border: '1px solid #000000'
    }}>
      {/* Header */}
      <div style={{
        position: 'absolute',
        left: '43px',
        top: '30px',
        fontFamily: 'Pretendard',
        fontWeight: '500',
        fontSize: '20px',
        letterSpacing: '1.6px',
        color: '#000000',
      }}>처음</div>

      <div style={{
        position: 'absolute',
        left: '90px',
        top: '30px',
        fontFamily: 'Pretendard',
        fontWeight: '500',
        fontSize: '20px',
        letterSpacing: '1.6px',
        color: '#000000',
      }}>캘린더</div>

      <div style={{
        position: 'absolute',
        left: '156px',
        top: '30px',
        fontFamily: 'Pretendard',
        fontWeight: '500',
        fontSize: '20px',
        letterSpacing: '1.6px',
        color: '#000000',
      }}>예약하기</div>

      <div style={{
        position: 'absolute',
        left: '240px',
        top: '30px',
        fontFamily: 'Pretendard',
        fontWeight: '500',
        fontSize: '20px',
        letterSpacing: '1.6px',
        color: '#000000',
      }}>유의사항</div>

      <div style={{
        position: 'absolute',
        left: '50%',
        top: '10px',
        fontFamily: 'Pretendard',
        textAlign: 'center',
        fontWeight: '800',
        fontSize: '36px',
        letterSpacing: '38px',
        color: '#000000',
      }}>DIRT</div>

      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50px',
        fontFamily: 'Pretendard',
        textAlign: 'center',
        fontWeight: '100',
        fontSize: '16px',
        letterSpacing: '0px',
        color: '#000000',
      }}>Digital content rental service</div>

      <div style={{
        position: 'absolute',
        left: '1235px',
        top: '30px',
        fontFamily: 'Pretendard',
        fontWeight: '500',
        fontSize: '20px',
        color: '#000000',
      }}>My page</div>

      <div style={{
        position: 'absolute',
        left: '1335px',
        top: '30px',
        fontFamily: 'Pretendard',
        fontWeight: '500',
        fontSize: '20px',
        color: '#000000',
      }}>Cart (3)</div>

      {/* Divider */}
      <div style={{
        position: 'absolute',
        width: '1354px',
        height: '1px',
        left: '43px',
        top: '65px',
        background: '#5F5F5F',
      }}></div>

      {/* Search Box */}
      <div style={{
        position: 'absolute',
        width: '454px',
        height: '26.42px',
        left: '438px',
        top: '188px',
        background: '#FFFFFF',
        boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.25)',
        borderRadius: '4px'
      }}>
        <input type="text" placeholder="search" style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          padding: '5px',
          fontFamily: 'Pretendard',
          fontWeight: '200',
          fontSize: '20px',
          letterSpacing: '1.6px'
        }} />
      </div>

      {/* Category */}
      <div style={{
        position: 'absolute',
        left: '50px',
        top: '111px',
        fontFamily: 'Pretendard',
        fontWeight: '500',
        fontSize: '20px',
        letterSpacing: '2.8px',
        color: '#000000',
      }}>CATEGORIES</div>

{/* Time Picker */}
      <div style={{
  position: 'absolute',
  left: '400px',
  top: '111px',
  display: 'flex',
  gap: '8px',
  color : 'black'
}}>
  <select value={rentalDate} onChange={(e) => setRentalDate(e.target.value)} style={{
    padding: '5px',
    fontFamily: 'Pretendard',
    fontSize: '16px',
  }}>
    {[...Array(8).keys()].map(day => (
      <option key={day} value={day + 1}>{day + 1}일</option>
    ))}
  </select>
  <select value={rentalTime} onChange={(e) => setRentalTime(e.target.value)} style={{
    padding: '5px',
    fontFamily: 'Pretendard',
    fontSize: '16px',
  }}>
    {timeOptions.map(time => (
      <option key={time} value={time}>{time}</option>
    ))}
  </select>
  -
  <select value={returnDate} onChange={(e) => setReturnDate(e.target.value)} style={{
    padding: '5px',
    fontFamily: 'Pretendard',
    fontSize: '16px',
  }}>
    {[...Array(8).keys()].map(day => (
      <option key={day} value={day + 1}>{day + 1}일</option>
    ))}
  </select>
  <select value={returnTime} onChange={(e) => setReturnTime(e.target.value)} style={{
    padding: '5px',
    fontFamily: 'Pretendard',
    fontSize: '16px',
  }}>
    {timeOptions.map(time => (
      <option key={time} value={time}>{time}</option>
    ))}
  </select>
        </div>


      <div style={{
        position: 'absolute',
        width: '34px',
        height: '3px',
        left: '51px',
        top: '146px',
        background: '#000000',
      }}></div>

      {/* Product Card */}
      <div style={{
        position: 'absolute',
        width: '233px',
        height: '357px',
        left: '321px',
        top: '242px',
        background: '#FDFDFD',
        boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.25)',
      }}>
        <img src="https://placehold.co/200x200" alt="camera" style={{
          width: '100%',
          height: '70%',
          objectFit: 'cover',
        }} />
        <div style={{
          marginTop: '5px',
          textAlign: 'center',
          fontFamily: 'Pretendard',
          fontWeight: '400',
          fontSize: '16px',
        }}>Sony A7S2</div>
      </div>

      {/* Pagination */}
      <div style={{
        position: 'absolute',
        width: '32px',
        height: '32px',
        left: '321px',
        top: '1719px',
        background: '#252525',
        textAlign: 'center',
        lineHeight: '32px',
        color: '#FFFFFF',
        fontFamily: 'Pretendard',
        fontWeight: '300',
        fontSize: '14px',
      }}>01</div>
    </div>
  );
};

export default ReservationMainPage;
