import React, { useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "../firebase/firebaseConfig";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // 🔒 에러 메시지 정리 함수 (사용자 친화적으로)
  const friendly = (err) => {
    const code = err?.code || "";
    if (code === "auth/popup-closed-by-user") return "팝업이 닫혀 로그인에 실패했습니다.";
    if (code === "auth/cancelled-popup-request") return "이미 로그인 창이 열려 있습니다. 잠시 후 다시 시도하세요.";
    if (code === "auth/popup-blocked") return "브라우저가 팝업을 차단했습니다. 팝업 허용 후 다시 시도하세요.";
    if (code === "auth/unauthorized-domain") return "허용되지 않은 도메인에서 요청되었습니다. 관리자에게 문의하세요.";
    if (code === "auth/network-request-failed") return "네트워크 오류가 발생했습니다. 연결을 확인해 주세요.";
    return err?.message || "로그인에 실패했습니다.";
  };

  // ✅ 팝업 로그인 (Redirect 미사용)
  const handleGoogleLogin = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        // 계정 선택 강제
        prompt: "select_account",
      });

      // 팝업 로그인
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 학교 이메일 제한
      const email = user?.email || "";
      if (!email.endsWith("@khu.ac.kr")) {
        // 비허용 메일 → 즉시 로그아웃
        await auth.signOut().catch(() => {});
        setLoading(false);
        setError("경희대학교 이메일(@khu.ac.kr)로만 로그인할 수 있습니다.");
        return;
      }

      // (선택) 액세스 토큰 저장 — 필요 없으면 제거 가능
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential?.accessToken || "";
      try {
        localStorage.setItem("googleAccessToken", accessToken);
        localStorage.setItem("user", JSON.stringify(user));
      } catch (_) {
        // iOS 사파리 프라이빗 등 로컬스토리지 불가 환경 무시
      }

      // Firestore 프로필 upsert
      const userRef = doc(db, "user_profiles", user.uid);
      await setDoc(
        userRef,
        {
          name: user.displayName || "",
          email: email,
          uid: user.uid,
          photoURL: user.photoURL || "",
          // createdAt / updatedAt 서버타임스탬프를 쓰고 싶으면 추가 구현
        },
        { merge: true }
      );

      // 프로필 완전성 확인
      const snap = await getDoc(userRef);
      const profile = snap.exists() ? snap.data() : {};

      const isIncomplete =
        !profile?.phoneNumber ||
        !profile?.studentId ||
        !profile?.agreementURL;

      if (isIncomplete) {
        navigate("/mypage", { state: { showAgreementReminder: true } });
      } else {
        navigate(location.state?.from || "/main");
      }

      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError("로그인 실패: " + friendly(err));
      // ❗ 여기서 Redirect로 폴백하지 않습니다.
      //    폴백 시 세션 스토리지 문제(초기 상태 누락)가 재발할 수 있어요.
    }
  }, [navigate, location]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-white px-4">
      <div className="flex flex-col items-center w-full max-w-sm p-6 sm:p-8 bg-black rounded-2xl sm:rounded-3xl shadow-2xl">
        <div className="w-full flex justify-center">
          <img
            src="/assets/lion-logo.png"
            alt="Logo"
            className="w-30 h-32 sm:w-32 sm:h-36 mb-6 sm:mb-8"
          />
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className={`flex items-center justify-center w-full py-3 px-4 text-base sm:text-lg font-semibold text-white bg-gray-700 rounded-lg hover:bg-gray-600 transition duration-300 focus:outline-none focus:ring-2 focus:ring-gray-500 ${
            loading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          <img
            src="/assets/google.png"
            alt="Google Logo"
            className="w-5 h-5 sm:w-6 sm:h-6 mr-2"
          />
          {loading ? "로그인 중..." : "구글 계정으로 로그인"}
        </button>

        {error && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg w-full">
            <p className="text-red-500 text-sm text-center">{error}</p>
          </div>
        )}

        <div className="mt-6 text-center w-full">
          <p className="text-white text-sm sm:text-base font-medium korean-bold mb-1">
            경희대학교 이메일로 로그인해주세요
          </p>
          <p className="text-gray-300 text-xs sm:text-sm font-light english-bold">
            Please log in with your Kyung Hee University email address.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
