import React, { useState } from "react";
import { useNavigate } from "react-router-dom";  
import { auth, signInWithPopup, provider } from "../firebase/firebaseConfig";

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

      // Directly navigate to MainHeader page after successful login
      navigate("/Main");  // Updated navigation path
      
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
        
        {/* 로고 이미지 */}
        <img 
          src="/assets/lion-logo.png" 
          alt="Logo" 
          className="w-23 h-36 mb-8"
        />

        {/* 구글 로그인 버튼 */}
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

        {/* 에러 메시지 */}
        {error && (
          <p className="mt-4 text-red-500 text-sm">{error}</p>
        )}

        {/* 안내 문구 */}
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