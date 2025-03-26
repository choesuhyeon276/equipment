import React from 'react';

const Header = () => {
    return (
        <div style={{ position: 'absolute', top: '0px', width: '100%', height: '80px', backgroundColor: '#F1F1F1', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ position: 'absolute', top: '36px', left: '43px', fontWeight: '500', cursor: 'pointer' }}>처음</div>
            <div style={{ position: 'absolute', top: '36px', left: '90px', fontWeight: '500', cursor: 'pointer' }}>캘린더</div>
            <div style={{ position: 'absolute', top: '36px', left: '156px', fontWeight: '500', cursor: 'pointer' }}>예약하기</div>
            <div style={{ position: 'absolute', top: '36px', left: '240px', fontWeight: '500', cursor: 'pointer' }}>유의사항</div>
            <div style={{ position: 'absolute', top: '36px', left: '1245px', fontWeight: '500', cursor: 'pointer' }}>My page</div>
            <div style={{ position: 'absolute', top: '36px', left: '1345px', fontWeight: '500', cursor: 'pointer' }}>Cart</div>
        </div>
    );
};

export default Header;
