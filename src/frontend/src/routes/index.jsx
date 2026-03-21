// ─── ROUTES ───────────────────────────────────────────────────────────────────
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

// Páginas públicas
import Register from '../pages/Auth/Register';
import Login    from '../pages/Auth/Login';
import Profile from '../pages/Profile/Profile.jsx';

// Layout autenticado
import AppLayout from '../components/Layout/AppLayout';

// Páginas privadas
import Dashboard        from '../pages/Dashboard/Dashboard';
import InstitutionList  from '../pages/Institutions/InstitutionList';
import SubjectList      from '../pages/Subjects/SubjectList';
import SubjectDetail    from '../pages/Subjects/SubjectDetail';
import Calendar         from '../pages/Calendar/Calendar';
import Schedule         from '../pages/Schedule/Schedule';
import Tests            from '../pages/Tests/Tests';
import Copilot          from '../pages/Copilot/Copilot';
import FriendList       from '../pages/Friends/FriendList';
import FriendDetail     from '../pages/Friends/FriendDetail';

// Guard para rutas privadas
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen" />;
  return user ? children : <Navigate to="/login" replace />;
}

// Guard para rutas públicas (si ya está logueado, redirige al dashboard)
function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen" />;
  return !user ? children : <Navigate to="/" replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ─── Públicas ─── */}
        <Route path="/register" element={
          <PublicRoute><Register /></PublicRoute>
        }/>
        <Route path="/login" element={
          <PublicRoute><Login /></PublicRoute>
        }/>

        {/* ─── Privadas (dentro del AppLayout con sidebar) ─── */}
        <Route path="/" element={
          <PrivateRoute><AppLayout /></PrivateRoute>
        }>
          <Route index                          element={<Dashboard />} />
          <Route path="profile"                 element={<Profile />} />
          <Route path="institutions"            element={<InstitutionList />} />
          <Route path="subjects"                element={<SubjectList />} />
          <Route path="subjects/:id"            element={<SubjectDetail />} />
          <Route path="calendar"                element={<Calendar />} />
          <Route path="schedule"                element={<Schedule />} />
          <Route path="tests"                   element={<Tests />} />
          <Route path="copilot"                 element={<Copilot />} />
          <Route path="friends"                 element={<FriendList />} />
          <Route path="friends/:id"             element={<FriendDetail />} />
        </Route>

        {/* Ruta 404 → redirige al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
