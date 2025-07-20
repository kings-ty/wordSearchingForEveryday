import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainApp from './MainApp';
import Login from './components/Login';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainApp />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;
