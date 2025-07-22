// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainApp from './MainApp'; 
import Login from './components/Login';
import NotionCallback from './components/NotionCallback';
import { UserProvider } from './contexts/UserContext'; 
import SelectNotionDbPage from './components/SelectNotionDbPage';


function App() {
  return (
    <Router>
      <UserProvider> {/* UserProvider로 앱을 감싸서 전역 상태 사용 */}
        <Routes>
          <Route path="/" element={<MainApp />} />
          <Route path="/login" element={<Login />} />
          <Route path="/oauth/notion/callback" element={<NotionCallback />} />
          <Route path="/select-notion-db" element={<SelectNotionDbPage />} />
        </Routes>
      </UserProvider>
    </Router>
  );
}

export default App;