import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { TopicPage } from './pages/TopicPage';
import { GuidePage } from './pages/GuidePage';

const routerBasename =
  import.meta.env.BASE_URL === '/'
    ? undefined
    : import.meta.env.BASE_URL.replace(/\/$/, '');

function App() {
  return (
    <Router basename={routerBasename}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/topics/:slug" element={<TopicPage />} />
        <Route path="/guides/:slug" element={<GuidePage />} />
        {/* 旧URLからのリダイレクト */}
        <Route path="/network-simulation" element={<Navigate to="/topics/network-simulation" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
