import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Index from './pages/Index';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import Note from './pages/Note';
import HealthLog from './pages/HealthLog';
import Ranking from './pages/Ranking';
import NotFound from './pages/NotFound';
import SocialRedirect from './pages/SocialRedirect';
import { AuthProvider } from './AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { AdminPage } from './pages/AdminPage';
import UserInfo from './pages/UserInfo';
import Settings from './pages/Settings';
import FindPassword from './pages/FindPassword';
import ResetPassword from './pages/ResetPassword';

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/note" element={<Note />} />
              <Route path="/healthlog" element={<HealthLog />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/userinfo" element={<UserInfo />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/find-password" element={<FindPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/auth/social-redirect" element={<SocialRedirect />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;