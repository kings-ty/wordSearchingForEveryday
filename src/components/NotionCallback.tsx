
// src/components/NotionCallback.tsx
import React, { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';

const API_BASE_URL = 'http://localhost:8000';

const NotionCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loginUser } = useUser();
  const hasFetched = useRef(false);

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const code = queryParams.get('code');

    // 이미 로그인되어 있고 Notion 정보가 있다면 바로 메인으로 리다이렉트 (선택 사항)
    // NotionConnected 상태로 확인
    // 이 조건은 user Context에 notionVocabularyDbId가 이미 설정된 경우에만 작동합니다.
    if (user && user.notionConnected && user.notionVocabularyDbId) {
      navigate('/');
      return;
    }

    if (code && !hasFetched.current) {
      hasFetched.current = true;
      console.log('Notion Authorization Code:', code);

      axios.post(`${API_BASE_URL}/api/notion/exchange-token`, { code: code })
        .then(async response => {
          console.log('Notion token exchange successful:', response.data);
          
          const appUserId = response.data.app_user_id; // 백엔드에서 받은 app_user_id
          // localStorage에 'app_user_id' 키로 값을 저장합니다.
          localStorage.setItem('app_user_id', appUserId); // <-- 키 이름 통일

          const userDataForContext = {
            appUserId: appUserId, // Context에는 카멜 케이스로 저장
            name: response.data.user_name || 'Notion User',
            avatarUrl: response.data.user_avatar || '',
            notionConnected: true,
            notionWorkspaceId: response.data.workspace_id,
            notionUserId: response.data.notion_user_id,
            notionUserName: response.data.user_name,
            notionUserAvatarUrl: response.data.user_avatar,
            // selectedVocabularyDbId는 아직 설정되지 않았으므로 초기값은 null 또는 undefined
            // 타입 오류 해결: 'null' 대신 'undefined'를 사용하거나,
            // User 타입 정의에서 `string | null | undefined`로 유연하게 정의해야 합니다.
            // 여기서는 `undefined`로 변경하여 타입 오류를 회피합니다.
            notionVocabularyDbId: undefined, 
          };
          
          loginUser(userDataForContext);

          const accessibleDatabases = response.data.accessible_databases || [];

          // 데이터베이스 목록과 함께 다음 페이지로 이동
          navigate('/select-notion-db', { state: { databases: accessibleDatabases, appUserId: appUserId } }); // appUserId도 함께 전달
        })
        .catch(error => {
          if (error.response && error.response.status === 400 &&
              error.response.data && error.response.data.error_description === "Invalid code: this code has already been used.") {
            console.warn("Notion code already used, likely due to StrictMode or double request. Attempting to recover.");
            // 이미 처리되었을 가능성이 높으므로, 사용자 정보를 다시 로드하거나
            // 이미 로그인 상태인지 확인하여 메인 페이지로 리다이렉트할 수 있습니다.
            const storedAppUserId = localStorage.getItem('app_user_id'); // <-- 키 이름 통일
            if (storedAppUserId) { 
                // 이 경우, 백엔드에 app_user_id를 보내 현재 상태를 다시 확인하도록 요청
                // 백엔드가 유효성을 검사하고 적절히 리다이렉트해줄 것입니다.
                window.location.href = `http://localhost:8000/api/notion/connect-notion?app_user_id=${storedAppUserId}`;
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
    } else if (!code) {
      console.error('No authorization code found in URL.');
      alert('Notion 인증 코드를 받지 못했습니다.');
      navigate('/login');
    }
  }, [location.search, navigate, loginUser, user]); // user를 의존성 배열에 추가하여 user 상태 변화에 반응

  return (
    <div style={{ padding: '20px', textAlign: 'center', color: 'white' }}>
      <p>Notion 인증 처리 중...</p>
      <p>잠시만 기다려 주세요.</p>
    </div>
  );
};

export default NotionCallback;
