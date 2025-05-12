// 모든 장바구니 관련 컴포넌트를 한 곳에서 내보내는 인덱스 파일
import CartPage from './CartPage';
import CartItemDesktop from './CartItemDesktop';
import CartItemMobile from './CartItemMobile';
import CartHeader from './CartHeader';
import CartNavItem from './CartNavItem';
import ReservationSummaryDesktop from './ReservationSummaryDesktop';
import ReservationSummaryMobile from './ReservationSummaryMobile';

export {
  CartPage,
  CartItemDesktop,
  CartItemMobile,
  CartHeader,
  CartNavItem,
  ReservationSummaryDesktop,
  ReservationSummaryMobile
};

// 기본 내보내기는 CartPage
export default CartPage;