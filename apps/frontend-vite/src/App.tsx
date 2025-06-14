// ===================================================================
// [개발용 서버 상태 확인] - 추후 이 부분의 import 3줄을 삭제하면 됩니다.
import { useState, useEffect } from 'react';
import axios from 'axios';
// ===================================================================

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


// ===================================================================
// [개발용 서버 상태 확인] - 추후 이 부분 2줄을 삭제하면 됩니다.
const CORE_API_URL = 'http://localhost:8080';
const AI_API_URL = 'http://localhost:8001';
// ===================================================================


// ===================================================================
// [개발용 서버 상태 확인] - 추후 이 부분 전체를 삭제하면 됩니다. (시작)
// ===================================================================
const ServerStatus = () => {
  const [coreStatus, setCoreStatus] = useState({ status: 'Checking...', color: 'gray' });
  const [aiStatus, setAiStatus] = useState({ status: 'Checking...', color: 'gray' });

  useEffect(() => {
    // 1. Core API (Spring Boot) 상태 확인
    axios.get(`${CORE_API_URL}/actuator/health`)
      .then(response => {
        if (response.data.status === 'UP') {
          setCoreStatus({ status: 'OK', color: 'limegreen' });
        } else {
          setCoreStatus({ status: 'WARN', color: 'orange' });
        }
      })
      .catch(() => {
        setCoreStatus({ status: 'Error', color: 'red' });
      });

    // 2. AI API (FastAPI) 상태 확인
    axios.get(`${AI_API_URL}/`)
      .then(response => {
        if (response.data.status === 'OK') {
          setAiStatus({ status: 'OK', color: 'limegreen' });
        } else {
          setAiStatus({ status: 'WARN', color: 'orange' });
        }
      })
      .catch(() => {
        setAiStatus({ status: 'Error', color: 'red' });
      });
  }, []); // 컴포넌트가 처음 마운트될 때 한 번만 실행

  // 상태 표시기 스타일
  const statusIndicatorStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(5px)',
    color: 'white',
    padding: '10px 20px',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
    zIndex: 9999,
    fontSize: '14px',
    fontFamily: 'sans-serif',
  };

  const statusDotStyle = (color: string): React.CSSProperties => ({
    display: 'inline-block',
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: color,
    marginRight: '8px',
    verticalAlign: 'middle',
  });

  return (
    <div style={statusIndicatorStyle}>
      <div style={{ marginBottom: '5px' }}>
        <span style={statusDotStyle(coreStatus.color)}></span>
        Core API: <strong>{coreStatus.status}</strong>
      </div>
      <div>
        <span style={statusDotStyle(aiStatus.color)}></span>
        AI API: <strong>{aiStatus.status}</strong>
      </div>
    </div>
  );
};
// ===================================================================
// [개발용 서버 상태 확인] - 추후 이 부분 전체를 삭제하면 됩니다. (끝)
// ===================================================================


const queryClient = new QueryClient();

const App = () => (
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>

      {/* ============================================================ */}
      {/* [개발용 서버 상태 확인] - 추후 이 라인을 삭제하면 됩니다.       */}
      <ServerStatus />
      {/* ============================================================ */}

    </TooltipProvider>
  </QueryClientProvider>
);

export default App;