import { useContext } from 'react';
import { AuthContext } from '../components/AuthProvider.jsx';

export default function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
