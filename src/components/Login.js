import React, { useState } from "react";
import { useNavigate } from "react-router-dom";  
import { auth, provider } from "../firebase/firebaseConfig";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

function Login() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();  

  const handleGoogleLogin = async () => {
    setLoading(true);
    console.log("구글 로그인 시작");

    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log("로그인 성공:", user);

      // ✅ access token 저장
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const accessToken = credential.accessToken;
      localStorage.setItem('googleAccessToken', accessToken);
      console.log("✅ Access Token:", accessToken);

       // ✅ Firestore에 user_profiles 저장
    await setDoc(doc(db, "user_profiles", user.uid), {
      name: user.displayName || "",
      email: user.email || "",
      uid: user.uid,
      photoURL: user.photoURL || "",
    }, { merge: true });

      // ✅ 로그인 후 메인 페이지 이동
      navigate("/Main");

      setLoading(false);
    } catch (err) {
      console.error("로그인 오류:", err.message);
      setLoading(false);
      setError("로그인 실패: " + err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-primary">
      <div className="flex flex-col items-center w-250 max-w-lg p-10 bg-black rounded-3xl shadow-2xl">
        
        <img 
          src="/assets/lion-logo.png" 
          alt="Logo" 
          className="w-23 h-36 mb-8"
        />

        <button
          onClick={handleGoogleLogin}
          className={`flex items-center justify-center w-full py-3 text-lg font-semibold text-white bg-gray-700 rounded-md hover:bg-gray-600 transition`}
        >
          <img 
            src="/assets/google.png" 
            alt="Google Logo" 
            className="w-6 h-6 mr-2"
          />
          {loading ? "로그인 중..." : "구글 계정으로 로그인"}
        </button>

        {error && (
          <p className="mt-4 text-red-500 text-sm">{error}</p>
        )}

        <div className="mt-4 text-center">
          <p className="text-white text-l font-medium korean-bold">
            경희대학교 이메일로 로그인해주세요
          </p>
          <p className="text-white text-base font-thin english-bold">
            Please log in with your Kyunghee University email address.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
