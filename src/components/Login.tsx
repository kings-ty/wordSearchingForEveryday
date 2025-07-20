// src/components/login.tsx
import React from 'react';
import './Login.css'; 

const Login = () => {
  const handleConnectNotion = async () => {
    try {
      const response = await fetch('http://localhost:8000/connect-notion');
      const data = await response.json();
      if (data.authorization_url) {
        window.location.href = data.authorization_url;
      }
    } catch (error) {
      console.error('Notion 연결 실패:', error);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img
          src="https://upload.wikimedia.org/wikipedia-logo.svg"
          alt="Wikipedia Logo"
        />
        <h2>Notion 계정 연동</h2>
        <p>단어장을 Notion에 자동으로 저장하려면 계정을 연결하세요.</p>
        <button className="connect-button" onClick={handleConnectNotion}>
          🔗 Notion 계정 연결하기
        </button>
      </div>
    </div>
  );
};

export default Login;
