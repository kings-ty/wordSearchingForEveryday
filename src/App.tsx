// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainApp from './MainApp'; // 기존 MainApp
import Login from './components/Login';
import NotionCallback from './components/NotionCallback';
import { UserProvider } from './contexts/UserContext'; // UserProvider
function App() {
  return (
    <Router>
      <UserProvider> {/* UserProvider로 앱을 감싸서 전역 상태 사용 */}
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/oauth/notion/callback" element={<NotionCallback />} />
          {/* 필요한 경우 대시보드 라우트 추가 */}
          {/* <Route path="/dashboard" element={<DashboardPage />} /> */}
        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;