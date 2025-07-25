// src/pages/AuthRedirect.tsx (가정)
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

const AuthRedirect = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('code');

    if (code) {
      // 백엔드의 /exchange-token 엔드포인트 호출
      axios.post('http://localhost:8000/api/notion/exchange-token', { code })
        .then(response => {
          console.log('Exchange token success:', response.data);
          const appUserId = response.data.app_user_id;
          if (appUserId) {
            localStorage.setItem('app_user_id', appUserId);
            alert('Notion 연결 및 로그인 성공!');
            navigate('/dashboard'); // 로그인 후 대시보드 페이지로 이동
          } else {
            alert('사용자 ID를 받아오지 못했습니다.');
            navigate('/login');
          }
        })
        .catch(error => {
          console.error('Exchange token error:', error.response ? error.response.data : error.message);
          alert('Notion 연결에 실패했습니다. 다시 시도해주세요.');
          navigate('/login');
        });
    } else {
      console.error('Notion OAuth code not found.');
      alert('Notion 인증 코드가 없습니다. 다시 시도해주세요.');
      navigate('/login');
    }
  }, [location, navigate]);

  return (
    <div>
      <p>Notion 연결 처리 중...</p>
    </div>
  );
};

export default AuthRedirect;