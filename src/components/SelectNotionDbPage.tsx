// src/components/SelectNotionDbPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext'; // UserContext로부터 user 가져오기
import '../components/SelectNotionDbpage.css'; 

const API_BASE_URL = 'http://localhost:8000'; // FastAPI 백엔드 URL

interface NotionDatabase {
    id: string;
    title: string;
}

const SelectNotionDbPage: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, setNotionVocabularyDbId } = useUser(); // useUser 훅을 통해 user 상태 가져오기

    const [databases, setDatabases] = useState<NotionDatabase[]>([]);
    const [selectedDbId, setSelectedDbId] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [creatingDb, setCreatingDb] = useState<boolean>(false);

    useEffect(() => {
        console.log("SelectNotionDbPage mounted. Checking user and location state.");

        // 사용자 정보가 없으면 로그인 페이지로 리다이렉트
        // user가 null이거나 appUserId가 없으면 즉시 리다이렉트
        if (!user || !user.appUserId) {
            console.log("User not logged in or appUserId missing. Redirecting to login.");
            navigate('/login');
            return; // 리다이렉트 후 이펙트 실행 중지
        }

        // NotionCallback에서 전달된 데이터베이스 목록을 가져옵니다.
        // location.state가 없거나 databases가 없으면 로그인 페이지로 리다이렉트
        if (!location.state || !location.state.databases) {
            console.log("No databases in location state. Redirecting to login.");
            navigate('/login');
            return; // 리다이렉트 후 이펙트 실행 중지
        }
        setDatabases(location.state.databases);

        console.log("Databases loaded:", location.state.databases);
        console.log("Current user appUserId:", user.appUserId); // user가 null이 아님을 보장
    }, [location.state, navigate, user]); // 의존성 배열에 user 추가

    const handleSelectDb = (dbId: string) => {
        console.log("Database selected:", dbId);
        setSelectedDbId(dbId);
    };
    
    const handleCreateNotionDb = async () => {
        setCreatingDb(true);
        setError(null);

        // user가 null이거나 appUserId가 없는 경우 처리
        if (!user || !user.appUserId) {
            setError("사용자 정보가 없습니다. 다시 로그인해주세요.");
            setCreatingDb(false);
            navigate('/login'); // 사용자 정보 없으면 로그인 페이지로 강제 이동
            return;
        }

        // user.appUserId가 null이 아님을 TypeScript에 알림
        const appUserId = user.appUserId; 

        const dataToSend = {
            app_user_id: appUserId, // 이제 appUserId는 null이 아님
            db_name: "My New Vocabulary Database" 
        };
        console.log("Sending create Notion DB request with:", dataToSend);

        try {
            const res = await fetch(`${API_BASE_URL}/api/notion/createNotionDB`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(dataToSend)
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({ detail: '응답 본문을 파싱할 수 없습니다.' }));
                console.error('Backend error creating Notion DB:', res.status, errorData);
                setError(`단어장 생성 실패: ${errorData.detail || '알 수 없는 오류가 발생했습니다.'}`);
                return;
            }

            const data = await res.json();
            console.log('Backend response for createNotionDB:', data);

            let newDbId: string | undefined;
            let newDbTitle: string | undefined;

            if (data.notion_db && data.notion_db.id) {
                newDbId = data.notion_db.id;
                newDbTitle = data.notion_db.title?.[0]?.plain_text || data.notion_db.title?.[0]?.text?.content || 'Vocabulary Database'; // title이 배열일 수 있으므로 안전하게 접근
            } 
            else if (data.id && typeof data.id === 'string' && data.title) {
                newDbId = data.id;
                newDbTitle = data.title;
            }

            if (newDbId && newDbTitle) {
                // TypeScript 오류 해결: newDbId와 newDbTitle이 string임을 명시적으로 알려줍니다.
                setDatabases(prev => [
                    ...prev,
                    { id: newDbId as string, title: newDbTitle as string } 
                ]);
                setSelectedDbId(newDbId); 
                alert('새 단어장이 성공적으로 생성되었습니다!');
            } else {
                setError('단어장 생성 실패: 백엔드 응답 형식이 올바르지 않습니다.');
            }
        } catch (err: any) {
            console.error('단어장 생성 중 클라이언트 측 오류:', err);
            setError('단어장 생성 중 네트워크 오류: ' + (err.message || '알 수 없는 오류'));
        } finally {
            setCreatingDb(false);
        }
    };

    const handleSubmit = async () => {
        // user가 null이거나 appUserId가 없는 경우 처리
        if (!user || !user.appUserId) {
            setError('사용자 정보가 없습니다. 다시 로그인해주세요.');
            navigate('/login'); // 사용자 정보 없으면 로그인 페이지로 강제 이동
            return;
        }

        if (!selectedDbId) {
            setError('단어장을 선택해야 합니다.');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // user.appUserId가 null이 아님을 TypeScript에 알림
            const appUserId = user.appUserId; 
            console.log(`Submitting selected DB ID: ${selectedDbId} for user: ${appUserId}`);
            
            // setNotionVocabularyDbId 함수는 UserContext 내에서 appUserId를 사용해야 합니다.
            // 이 함수가 내부적으로 appUserId를 사용한다고 가정합니다.
            await setNotionVocabularyDbId(selectedDbId); 

            alert('단어장이 성공적으로 설정되었습니다!');
            navigate('/'); 
        } catch (err) {
            console.error('단어장 설정 중 오류:', err);
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
                
                <button
                    className="create-db-button"
                    onClick={handleCreateNotionDb}
                    disabled={creatingDb}
                    style={{ marginBottom: '1rem' }}
                >
                    {creatingDb ? '생성 중...' : '새 단어장 생성'}
                </button>

                {loading && <p>데이터베이스 설정 중...</p>}
                {error && <p className="error-message">{error}</p>}

                {/* user가 null이 아닐 때만 databases를 렌더링하도록 조건 추가 */}
                {user && databases.length === 0 && !loading && !creatingDb ? ( 
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
