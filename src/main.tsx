import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Route, Routes } from 'react-router-dom';
import './styles.css';
import { Layout } from './components/Layout';
import { AuthProvider } from './lib/auth';
import { ToastProvider } from './lib/hooks';
import { Admin } from './pages/Admin';
import { DeckDetail } from './pages/DeckDetail';
import { DeckEditor } from './pages/DeckEditor';
import { Decks } from './pages/Decks';
import { Guestbook } from './pages/Guestbook';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Members } from './pages/Members';
import { MyPage } from './pages/MyPage';
import { Warehouse } from './pages/Warehouse';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthProvider>
        {/* HashRouter: GitHub Pages 같은 정적 호스팅에서도 새로고침 시 404 가 나지 않습니다. */}
        <HashRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="members" element={<Members />} />
              <Route path="decks" element={<Decks />} />
              <Route path="decks/new" element={<DeckEditor />} />
              <Route path="decks/:id" element={<DeckDetail />} />
              <Route path="decks/:id/edit" element={<DeckEditor />} />
              <Route path="warehouse" element={<Warehouse />} />
              <Route path="guestbook" element={<Guestbook />} />
              <Route path="me" element={<MyPage />} />
              <Route path="admin" element={<Admin />} />
              <Route path="login" element={<Login />} />
              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
        </HashRouter>
      </AuthProvider>
    </ToastProvider>
  </StrictMode>,
);
