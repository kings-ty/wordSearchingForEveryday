// src/contexts/UserContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// 사용자 정보 타입 정의
interface User {
  name: string;
  avatarUrl: string;
  notionAccessToken?: string; // 보안상 민감하므로 클라이언트에 직접 저장하는 것은 권장하지 않음
                               // 여기서는 예시를 위해 포함하지만, 실제로는 백엔드에서 관리해야 함
  workspaceId?: string;
  notionUserId?: string; // Notion에서 받은 사용자 ID 추가
  notionVocabularyDbId?: string; // 사용자가 선택한 Notion 단어장 DB ID 추가
}

interface UserContextType {
  user: User | null;
  loginUser: (userData: User) => void;
  logoutUser: () => void;
  setNotionVocabularyDbId: (dbId: string) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  // 로컬 스토리지에서 사용자 정보 로드 (새로고침 시 로그인 상태 유지)
  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const loginUser = (userData: User) => {
    setUser(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData)); // 로컬 스토리지에 저장
  };

  const logoutUser = () => {
    setUser(null);
    localStorage.removeItem('currentUser'); // 로컬 스토리지에서 제거
  };

  const setNotionVocabularyDbId = (dbId: string) => {
    setUser(prevUser => {
      if (prevUser) {
        const updatedUser = { ...prevUser, notionVocabularyDbId: dbId };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        return updatedUser;
      }
      return null;
    });
  };

  return (
    <UserContext.Provider value={{ user, loginUser, logoutUser, setNotionVocabularyDbId }}>
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