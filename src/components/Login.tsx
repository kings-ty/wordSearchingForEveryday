// src/components/Login.tsx
import React from 'react';
import './Login.css';

const Login = () => {
  const handleConnectNotion = () => {
    // fetch를 사용하지 않고, 브라우저가 직접 FastAPI 엔드포인트로 이동하도록 합니다.
    // FastAPI는 RedirectResponse를 통해 Notion OAuth URL로 최종 리다이렉션을 유도합니다.
    window.location.href = 'http://localhost:8000/connect-notion';
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <img
          src="https://upload.wikimedia.org/wikipedia-logo.svg"
          alt="Wikipedia Logo"
        />
        <h2>Notion Login</h2>
        <p>Please connect with Notion for saving words</p>
        <button className="connect-button" onClick={handleConnectNotion}>
          🔗 Notion Connecting
        </button>
      </div>
    </div>
  );
};

export default Login;