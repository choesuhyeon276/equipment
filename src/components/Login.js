import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "../firebase/firebaseConfig";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    console.log("구글 로그인 시작");

    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // ✅ 학교 이메일이 아니면 차단
      if (!user.email.endsWith("@khu.ac.kr")) {
        await auth.signOut();
        setLoading(false);
        setError("경희대학교 이메일(@khu.ac.kr)로만 로그인할 수 있습니다.");
        return;
      }

      // ✅ access token 저장
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken;
      localStorage.setItem("googleAccessToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      // ✅ Firestore에 사용자 정보 저장
      const userRef = doc(db, "user_profiles", user.uid);
      await setDoc(
        userRef,
        {
          name: user.displayName || "",
          email: user.email || "",
          uid: user.uid,
          photoURL: user.photoURL || "",
        },
        { merge: true }
      );

      const profileSnap = await getDoc(userRef);
      const profileData = profileSnap.data();

      const isIncomplete =
        !profileData.phoneNumber ||
        !profileData.studentId ||
        !profileData.agreementURL;

      if (isIncomplete) {
        console.log("정보 누락 → MyPage로 리디렉션");
        navigate("/mypage", {
          state: { showAgreementReminder: true },
        });
      } else {
        console.log("정보 완전 → 메인으로 이동");
        navigate("/Main");
      }

      setLoading(false);
    } catch (err) {
      console.error("로그인 오류:", err.message);
      setLoading(false);
      setError("로그인 실패: " + err.message);
    }
  };

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