import React from 'react';

const CartPage = () => {
    return (
        <div style={{ position: 'relative', width: '100%', height: '1375px', backgroundColor: '#fff', border: '1px solid #000', boxSizing: 'border-box', overflow: 'hidden', textAlign: 'left', fontSize: '20px', color: '#000', fontFamily: 'Pretendard' }}>
            <div style={{ position: 'absolute', top: '36px', left: '43px', fontWeight: '500', cursor: 'pointer' }}>처음</div>
            <div style={{ position: 'absolute', top: '36px', left: '90px', fontWeight: '500', cursor: 'pointer' }}>캘린더</div>
            <div style={{ position: 'absolute', top: '36px', left: '156px', fontWeight: '500', cursor: 'pointer' }}>예약하기</div>
            <div style={{ position: 'absolute', top: '36px', left: '240px', fontWeight: '500', cursor: 'pointer' }}>유의사항</div>
            <div style={{ position: 'absolute', top: '36px', left: '1245px', fontWeight: '500', cursor: 'pointer' }}>My page</div>
            <div style={{ position: 'absolute', top: '36px', left: '1345px', fontWeight: '500', cursor: 'pointer' }}>Cart</div>
            <div style={{ position: 'absolute', top: '97px', left: '37px', fontSize: '160px', fontWeight: '800' }}>장바구니 목록</div>

            <div style={{ position: 'absolute', top: '306px', left: '46px', width: '230px', height: '230px', backgroundColor: '#fdfdfd', border: '1px solid #cecece', boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.25)', boxSizing: 'border-box' }}></div>
            <div style={{ position: 'absolute', top: '573px', left: '46px', width: '230px', height: '230px', backgroundColor: '#fdfdfd', border: '1px solid #cecece', boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.25)', boxSizing: 'border-box' }}></div>
            <div style={{ position: 'absolute', top: '980px', left: '46px', width: '230px', height: '230px', backgroundColor: '#fdfdfd', border: '1px solid #cecece', boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.25)', boxSizing: 'border-box' }}></div>
            <div style={{ position: 'absolute', top: '980px', left: '303px', width: '230px', height: '230px', backgroundColor: '#fdfdfd', border: '1px solid #cecece', boxShadow: '0px 0px 4px rgba(0, 0, 0, 0.25)', boxSizing: 'border-box' }}></div>

            <div style={{ position: 'absolute', top: '880px', left: '52px', fontSize: '64px' }}>다음을 많이 구매했어요</div>
            <div style={{ position: 'absolute', top: '1292px', left: '1275px', fontSize: '36px', cursor: 'pointer' }}>예약하기</div>
        </div>
    );
};

export default CartPage;
