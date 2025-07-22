// src/components/SelectNotionDbPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useUser } from '../contexts/UserContext';
import './SelectNotionDbPage.css'; // CSS 파일 생성 필요

const API_BASE_URL = 'http://localhost:8000'; // FastAPI 백엔드 URL

interface NotionDatabase {
  id: string;
  title: string;
}

const SelectNotionDbPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, setNotionVocabularyDbId } = useUser();

  const [databases, setDatabases] = useState<NotionDatabase[]>([]);
  const [selectedDbId, setSelectedDbId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // NotionCallback에서 전달된 데이터베이스 목록을 가져옵니다.
    if (location.state && location.state.databases) {
      setDatabases(location.state.databases);
    } else {
      // 데이터베이스 목록이 없으면 로그인 페이지로 리다이렉트
      navigate('/login');
    }

    // 사용자가 로그인되어 있지 않으면 로그인 페이지로 리다이렉트
    if (!user || !user.notionUserId) {
      navigate('/login');
    }
  }, [location.state, navigate, user]);

  const handleSelectDb = (dbId: string) => {
    setSelectedDbId(dbId);
  };

  const handleSubmit = async () => {
    if (!selectedDbId || !user || !user.notionUserId) {
      setError('단어장을 선택하고 로그인해야 합니다.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 선택된 데이터베이스 ID를 백엔드에 저장 요청
      const response = await axios.post(`${API_BASE_URL}/api/notion/set-vocabulary-db`, {
        database_id: selectedDbId,
        user_id: user.notionUserId, // Notion 사용자 ID를 함께 보냅니다.
      });

      if (response.status === 200) {
        setNotionVocabularyDbId(selectedDbId); // Context에 선택된 DB ID 저장
        alert('단어장이 성공적으로 설정되었습니다!');
        navigate('/'); // 메인 페이지로 이동
      } else {
        setError(response.data.detail || '단어장 설정에 실패했습니다.');
      }
    } catch (err) {
      console.error('단어장 설정 API 호출 오류:', err);
      setError('단어장 설정 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="select-db-container">
      <div className="select-db-box">
        <h2>단어장을 선택해주세요</h2>
        <p>Notion에 단어를 저장할 데이터베이스를 선택하세요.</p>
        
        {loading && <p>데이터베이스 설정 중...</p>}
        {error && <p className="error-message">{error}</p>}

        {databases.length === 0 ? (
          <p>접근 가능한 데이터베이스가 없습니다. Notion 통합 권한을 확인해주세요.</p>
        ) : (
          <ul className="database-list">
            {databases.map((db) => (
              <li
                key={db.id}
                className={`database-item ${selectedDbId === db.id ? 'selected' : ''}`}
                onClick={() => handleSelectDb(db.id)}
              >
                {db.title}
              </li>
            ))}
          </ul>
        )}

        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={!selectedDbId || loading || databases.length === 0}
        >
          {loading ? '설정 중...' : '선택 완료'}
        </button>
      </div>
    </div>
  );
};

export default SelectNotionDbPage;
