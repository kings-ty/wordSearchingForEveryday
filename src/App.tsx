// App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainApp from './MainApp';
import Login from './components/Login';
import NotionCallback from './components/NotionCallback';
import SelectNotionDbPage from './components/SelectNotionDbPage';
import { UserProvider, useUser } from './contexts/UserContext';

const AppContent: React.FC = () => {
  const { isAppReady } = useUser();

  if (!isAppReady) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#1a1a2e', color: 'white' }}>
        <p>Initializing application...</p>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<MainApp />} />
      <Route path="/login" element={<Login />} />
      <Route path="/oauth/notion/callback" element={<NotionCallback />} />
      <Route path="/select-notion-db" element={<SelectNotionDbPage />} />
    </Routes>
  );
};

function App() {
  return (
    <Router>
      <UserProvider>
        <AppContent />
      </UserProvider>
    </Router>
  );
}

export default App;
