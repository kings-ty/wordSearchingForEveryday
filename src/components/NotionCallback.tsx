// src/components/NotionCallback.tsx (또는 src/pages/NotionCallback.tsx)
import React, { use, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios'; // npm install axios 필요
import { useUser } from '../contexts/UserContext';

const NotionCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {loginUser} = useUser();
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('code');

    if (code) {
      console.log('Notion Authorization Code:', code);

      // 획득한 code를 FastAPI 백엔드로 전송
      axios.post('http://localhost:8000/api/notion/exchange-token', { code: code })
        .then(response => {
          const userData = {
            name: response.data.user_name || 'Notion User',
            avatarUrl: response.data.user_avatar || '',
            notionAccessToken: response.data.access_token, // 보안상 민감 (실제 서비스는 백엔드에서 관리)
            workspaceId: response.data.workspace_id,
          };
          loginUser(userData); // 사용자 정보를 Context에 저장
          alert('Notion Login Success!');
          navigate('/'); 
        })
        .catch(error => {
          console.error('Error exchanging Notion token:', error);
          // 에러 처리: 사용자에게 오류 메시지 표시
          navigate('/error'); // 예시: 에러 페이지로 이동
        });
    } else {
      console.error('No authorization code found in URL.');
      navigate('/error'); // code가 없는 경우 에러 페이지로 이동
    }
  }, [location, navigate, loginUser]);

  return (
    <div>
      <p>Notion Processing...</p>
    </div>
  );
};

export default NotionCallback;