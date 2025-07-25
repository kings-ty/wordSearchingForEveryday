// src/contexts/UserContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8000'; // FastAPI 백엔드 URL

// 사용자 정보 타입 정의
interface User {
  appUserId: string; // 앱 내부 사용자 ID (UUID 문자열)
  name: string;
  avatarUrl: string;
  notionConnected: boolean; // Notion 연동 여부
  notionWorkspaceId?: string;
  notionUserId?: string; // Notion 내부 사용자 ID
  notionUserName?: string;
  notionUserAvatarUrl?: string;
  notionVocabularyDbId?: string | null; // 사용자가 선택한 Notion 단어장 DB ID (null 허용)
}

interface UserContextType {
  user: User | null;
  loginUser: (userData: Omit<User, 'notionConnected' | 'notionWorkspaceId' | 'notionUserId' | 'notionUserName' | 'notionUserAvatarUrl' | 'notionVocabularyDbId'> & {
    notionConnected: boolean;
    notionWorkspaceId?: string;
    notionUserId?: string;
    notionUserName?: string;
    notionUserAvatarUrl?: string;
    notionVocabularyDbId?: string | null; // null 허용
  }) => void;
  logoutUser: () => void;
  setNotionVocabularyDbId: (dbId: string | null) => Promise<void>; // null 허용하도록 수정
  isAppReady: boolean; // 앱 초기화 준비 상태
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAppReady, setIsAppReady] = useState(false); // 앱 초기화 준비 상태

  // 사용자 Notion 데이터를 백엔드에서 로드하는 함수
  // 이 함수는 useEffect 내에서만 호출되므로 useCallback으로 감쌉니다.
  const loadUserNotionData = useCallback(async (appUserId: string) => {
    try {
      // 새로운 백엔드 엔드포인트: /api/notion/user-notion-status/{app_user_id}
      const response = await axios.get(`${API_BASE_URL}/api/notion/user-notion-status/${appUserId}`);
      const data = response.data;

      const userData: User = {
        appUserId: data.app_user_id,
        name: data.user_name || 'Guest User',
        avatarUrl: data.avatar_url || '',
        notionConnected: data.notion_connected,
        notionWorkspaceId: data.notion_workspace_id,
        notionUserId: data.notion_user_id,
        notionUserName: data.notion_user_name,
        notionUserAvatarUrl: data.notion_user_avatar_url,
        notionVocabularyDbId: data.notion_vocabulary_db_id, // null 또는 실제 ID
      };
      setUser(userData);
      console.log("User data loaded from backend:", userData);
    } catch (error) {
      console.error("Error loading user Notion data:", error);
      // 오류 발생 시 사용자 정보 초기화 (로그아웃 상태로 간주)
      setUser(null);
      localStorage.removeItem('app_user_id'); // 키 이름 통일
    } finally {
      // 데이터 로드 성공/실패와 관계없이 앱 준비 완료
      setIsAppReady(true); 
    }
  }, []); // loadUserNotionData는 의존성이 없으므로 빈 배열 유지

  // 앱 시작 시 로컬 스토리지에서 app_user_id 로드 및 사용자 정보 로드 시도
  useEffect(() => {
    const storedAppUserId = localStorage.getItem('app_user_id'); // 키 이름 통일
    if (storedAppUserId) {
      loadUserNotionData(storedAppUserId);
    } else {
      // app_user_id가 없으면 바로 앱 준비 완료 상태로 변경
      setIsAppReady(true);
    }
  }, [loadUserNotionData]);

  // loginUser 함수: Notion OAuth 성공 후 사용자 정보를 Context에 설정
  const loginUser = useCallback((userData: Omit<User, 'notionConnected' | 'notionWorkspaceId' | 'notionUserId' | 'notionUserName' | 'notionUserAvatarUrl' | 'notionVocabularyDbId'> & {
    notionConnected: boolean;
    notionWorkspaceId?: string;
    notionUserId?: string;
    notionUserName?: string;
    notionUserAvatarUrl?: string;
    notionVocabularyDbId?: string | null; // null 허용
  }) => {
    // userData가 이미 User 인터페이스의 모든 필드를 포함하도록 가정
    const fullUserData: User = {
      ...userData,
      // notionConnected, notionWorkspaceId 등은 userData에 이미 포함되어야 함
      // notionVocabularyDbId가 없으면 undefined로 처리
      notionVocabularyDbId: userData.notionVocabularyDbId === undefined ? null : userData.notionVocabularyDbId
    };
    setUser(fullUserData);
    localStorage.setItem('app_user_id', fullUserData.appUserId); // app_user_id를 로컬 스토리지에 저장
    console.log("User logged in:", fullUserData);
  }, []);

  // logoutUser 함수: 사용자 로그아웃 처리
  const logoutUser = useCallback(() => {
    setUser(null);
    localStorage.removeItem('app_user_id'); // 로컬 스토리지에서 app_user_id 제거
    console.log("User logged out.");
  }, []);

  // setNotionVocabularyDbId 함수: 사용자가 선택한 Notion DB ID를 백엔드에 저장하고 Context 업데이트
  const setNotionVocabularyDbId = useCallback(async (dbId: string | null) => { // null 허용
    if (!user || !user.appUserId) {
      console.error("User not logged in to set Notion Vocabulary DB ID.");
      throw new Error("User not authenticated.");
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/notion/set-vocabulary-db`, {
        database_id: dbId, // null도 보낼 수 있도록
        app_user_id: user.appUserId,
      });
      if (response.status === 200) {
        setUser(prevUser => {
          if (prevUser) {
            return { ...prevUser, notionVocabularyDbId: dbId };
          }
          return null;
        });
        console.log("Notion Vocabulary DB ID updated in backend and context:", dbId);
      } else {
        throw new Error(response.data.detail || "Failed to set vocabulary database.");
      }
    } catch (error) {
      console.error("Error setting Notion Vocabulary DB ID:", error);
      throw error;
    }
  }, [user]); // user 객체가 변경될 때마다 함수 재생성

  return (
    <UserContext.Provider value={{ user, loginUser, logoutUser, setNotionVocabularyDbId, isAppReady }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
