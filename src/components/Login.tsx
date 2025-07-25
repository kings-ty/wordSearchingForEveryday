// src/components/Login.tsx
import React, { useEffect } from 'react';
import './Login.css';

const Login = () => {
  useEffect(() => {
    // localStorage에서 'app_user_id' 키로 값을 읽습니다.
    const storedAppUserId = localStorage.getItem('app_user_id'); // <-- 키 이름 통일
    console.log("Checking stored app_user_id:", storedAppUserId); 
    
    if (storedAppUserId) {
      console.log("Found stored app_user_id:", storedAppUserId);
      window.location.href = `http://localhost:8000/api/notion/connect-notion?app_user_id=${storedAppUserId}`;
      return; 
    }
    console.log("No app_user_id found in localStorage. Showing login button.");
  }, []);

  const handleConnectNotion = () => {
    window.location.href = 'http://localhost:8000/api/notion/connect-notion';
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/4/45/Notion_app_logo.png"
          alt="Notion Logo"
          className="w-24 h-24 mb-4 rounded-full"
        />
        <h2 className="text-2xl font-bold mb-2">Notion Login</h2>
        <p className="text-gray-600 mb-6">단어 저장을 위해 Notion과 연결해주세요.</p>
        <button 
          className="connect-button bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-300 ease-in-out flex items-center justify-center"
          onClick={handleConnectNotion}
        >
          <span className="mr-2">🔗</span> Notion 연결하기
        </button>
      </div>
    </div>
  );
};

export default Login;