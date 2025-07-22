// src/components/NotionCallback.tsx (또는 src/pages/NotionCallback.tsx)
import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios'; // npm install axios 필요
import { useUser } from '../contexts/UserContext';

const API_BASE_URL = 'http://localhost:8000';

const NotionCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const {loginUser} = useUser();
  const hasFetched = useRef(false);
  
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('code');

    if (code) {
      console.log('Notion Authorization Code:', code);

      // 획득한 code를 FastAPI 백엔드로 전송
      axios.post(`${API_BASE_URL}/api/notion/exchange-token`, { code: code })
        .then(response => {
          const userData = {
            name: response.data.user_name || 'Notion User',
            avatarUrl: response.data.user_avatar || '',
            notionAccessToken: response.data.access_token, // 보안상 민감 (실제 서비스는 백엔드에서 관리)
            workspaceId: response.data.workspace_id,
            notionUserId: response.data.user_id,
          };
          loginUser(userData); // 사용자 정보를 Context에 저장
          alert('Notion Login Success!');
          const accessibleDatabases = response.data.accessible_databases || [];
          navigate('/select-notion-db', { state: { databases: accessibleDatabases } });
          // navigate('/'); 
        })
        .catch(error => {
          if (error.response && error.response.status === 400 &&
              error.response.data && error.response.data.error_description === "Invalid code: this code has already been used.") {
          console.error("Notion code already used, likely due to StrictMode or double request. Ignoring this error.");
          if (localStorage.getItem('currentUser')) {
                navigate('/');
                alert('Notion 연동 및 로그인 성공 (이미 처리됨)!');
            } else {
                alert('Notion 연동에 실패했습니다. 다시 시도해주세요.');
                navigate('/login');
            }
        } else {
            console.error('Error exchanging Notion token:', error);
            alert('Notion 연동에 실패했습니다. 다시 시도해주세요.');
            navigate('/login');
          }
    });
    } else {
      console.error('No authorization code found in URL.');
      alert('Notion 인증 코드를 받지 못했습니다.');
      navigate('/login');
    }
  }, [location, navigate, loginUser]);

  return (
    <div>
      <p>Notion Processing...</p>
    </div>
  );
};

export default NotionCallback;