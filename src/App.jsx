import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import AuthProvider from './components/AuthProvider.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Landing from './components/Landing.jsx';
import Login from './components/Login.jsx';
import Dashboard from './components/Dashboard.jsx';
import ProjectView from './components/ProjectView.jsx';
import NotFound from './components/NotFound.jsx';
import LoadingScreen from './components/LoadingScreen.jsx';
import './App.css';

// SharePage is the only public, anonymous route. Most visitors will land here
// once and never see it again, so it ships in its own chunk to keep the
// dashboard bundle lean.
const SharePage = lazy(() => import('./components/SharePage.jsx'));

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <ProtectedRoute>
              <ProjectView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/share/:token"
          element={
            <Suspense fallback={<LoadingScreen label="Loading shared timeline" />}>
              <SharePage />
            </Suspense>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
