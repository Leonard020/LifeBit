import React, { useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  FileText,
  BarChart3,
  Trophy,
  User,
  Moon,
  Sun,
  ChevronUp,
  Settings,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/AuthContext'; // ✅ 전역 상태 기반
import { isAdmin, removeToken } from '@/utils/auth'; // ✅ removeToken 추가
import { useTheme } from '@/contexts/ThemeContext';
import NotificationBell from '@/components/NotificationBell';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface LayoutProps {
  children: React.ReactNode;
}

const WebHeader = ({ setContactOpen }: { setContactOpen: (open: boolean) => void }) => {
  const { toast } = useToast();
  const { isLoggedIn, nickname, setIsLoggedIn, setNickname } = useAuth();
  const { open: sidebarOpen } = useSidebar();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [mailLoading, setMailLoading] = useState(false);

  const handleLogout = () => {
    removeToken(); // 모든 토큰과 사용자 정보 삭제
    setIsLoggedIn(false);
    setNickname('');
    toast({
      title: '로그아웃',
      description: '성공적으로 로그아웃되었습니다.',
    });

    window.location.href = '/login'
  };

  const handleSendMail = async () => {
    setMailLoading(true);
    setTimeout(() => {
      setMailLoading(false);
      setContactOpen(false);
      alert('메일이 전송되었습니다!');
    }, 1000);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/LifeBitLogo2.png"
              alt="LifeBit 로고"
              style={{
                height: '38px',
                minWidth: '2px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
                margin: '0px',
                borderRadius: '8px',
                background: 'transparent'
              }}
            />
          </Link>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="hover-lift"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <NotificationBell />
            <Link to="/settings">
              <Settings className="w-5 h-5 text-foreground hover:text-primary transition" />
            </Link>

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover-lift">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5 text-sm font-medium">
                    {nickname || '사용자'}
                  </div>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      프로필
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/userinfo" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      회원정보
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin() && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        관리자페이지
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setContactOpen(true)}>
                    관리자 문의 메일
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout}>
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button className="gradient-bg hover:opacity-90 transition-opacity">
                  로그인
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <div
        className={`fixed top-20 z-50 transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'left-64' : 'left-4'
        }`}
      >
        <SidebarTrigger className="bg-background/80 backdrop-blur border hover:bg-accent hover:text-accent-foreground shadow-md" />
      </div>
    </>
  );
};

const GradientFileTextIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="url(#sidebar-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="sidebar-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7c3aed" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);
const GradientUserIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="url(#sidebar-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="sidebar-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7c3aed" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);
const GradientTrophyIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="url(#sidebar-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="sidebar-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7c3aed" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <path d="M21 4H17V2H7V4H3V6C3 10.4183 7.58172 14 12 14C16.4183 14 21 10.4183 21 6V4Z" />
    <path d="M8 21H16" />
    <path d="M12 17V21" />
  </svg>
);
const GradientBarChartIcon = ({ className }: { className?: string }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} stroke="url(#sidebar-gradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <defs>
      <linearGradient id="sidebar-gradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#7c3aed" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    <line x1="12" y1="20" x2="12" y2="10" />
    <line x1="18" y1="20" x2="18" y2="4" />
    <line x1="6" y1="20" x2="6" y2="16" />
  </svg>
);

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [isNavVisible, setIsNavVisible] = useState(true);
  const { isLoggedIn, setIsLoggedIn, setNickname } = useAuth();
  const { toast } = useToast();
  const { isDarkMode, toggleDarkMode } = useTheme();

  // 메일 모달 상태/핸들러
  const [contactOpen, setContactOpen] = useState(false);

  const toggleNavVisibility = () => {
    setIsNavVisible(!isNavVisible);
  };

  // ✅ 이미지에 맞게 메뉴 순서 변경: 노트 → 프로필 → 랭킹 → 건강로그
  const navigationItems = [
    { path: '/note', icon: FileText, label: '노트' },
    { path: '/profile', icon: User, label: '프로필' },
    { path: '/ranking', icon: Trophy, label: '랭킹' },
    { path: '/healthlog', icon: BarChart3, label: '건강로그' },
  ];

  if (!isMobile) {
    return (
      <SidebarProvider>
        <div className="min-h-screen bg-background flex w-full">
          <AppSidebar />
          <SidebarInset className="flex-1">
            <WebHeader setContactOpen={setContactOpen} />
            <main className="flex-1">{children}</main>
            <Dialog open={contactOpen} onOpenChange={setContactOpen}>
              <DialogContent className="animate-fade-in bg-background text-foreground shadow-xl border border-border rounded-xl">
                <div className="flex justify-between items-center mb-2">
                  <DialogTitle className="text-2xl font-bold">문의하기</DialogTitle>
                </div>
                <DialogDescription asChild>
                  <div className="text-base text-muted-foreground mb-4">
                    관련 문제, 일반적인 지원 요청 등 모든 고객 지원 문의는
                    <span className="block my-3">
                      <a href="mailto:admin@lifebit.com" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-[#7c3aed] bg-[#ede9fe] hover:bg-[#e0d7fa] transition-all duration-200 shadow-sm animate-pulse">
                        admin@lifebit.com
                      </a>
                    </span>
                    이메일로 보내주세요.
                  </div>
                </DialogDescription>
              </DialogContent>
            </Dialog>
          </SidebarInset>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2">
            <img
              src="/LifeBitLogo2.png"
              alt="LifeBit 로고"
              style={{
                height: '38px',
                minWidth: '180px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block',
                margin: '0px',
                borderRadius: '8px',
                background: 'transparent'
              }}
            />
          </Link>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleDarkMode}
              className="hover-lift"
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <NotificationBell />
            <Link to="/settings">
              <Settings className="w-5 h-5 text-foreground hover:text-primary transition" />
            </Link>

            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="hover-lift">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      프로필
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/userinfo" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      회원정보
                    </Link>
                  </DropdownMenuItem>
                  {isAdmin() && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center">
                        <User className="mr-2 h-4 w-4" />
                        관리자페이지
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setContactOpen(true)}>
                    관리자 문의 메일
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { setIsLoggedIn(false); setNickname(''); window.location.href = '/login'; }}>
                    로그아웃
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button className="gradient-bg hover:opacity-90 transition-opacity">
                  로그인
                </Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1" style={{ paddingBottom: isNavVisible ? '80px' : '20px' }}>
        {children}
      </main>

      <div
        className={`fixed left-1/2 transform -translate-x-1/2 z-50 ${
          isNavVisible ? 'bottom-16' : 'bottom-4'
        }`}
      >
        <button
          onClick={toggleNavVisibility}
          title={isNavVisible ? "네비게이션 숨기기" : "네비게이션 보이기"}
          className="w-12 h-12 rounded-full shadow-lg bg-gradient-to-br from-teal-400 to-blue-500 hover:from-teal-500 hover:to-blue-600 text-white border-4 border-white transition-all duration-300 ease-in-out transform hover:scale-110 flex items-center justify-center"
        >
          <div
            className={`transition-transform duration-300 ${
              isNavVisible ? 'rotate-180' : 'rotate-0'
            }`}
          >
            <ChevronUp className="w-5 h-5" />
          </div>
        </button>
      </div>

      <nav
        className={`fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t transition-transform duration-300 ease-in-out ${
          isNavVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="container px-4">
          <div className="flex items-center justify-around h-16">
            <Link
              to="/"
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                location.pathname === '/'
                  ? 'text-primary bg-primary/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              <FileText className="h-5 w-5" />
              <span className="text-xs font-medium">홈</span>
            </Link>
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              let GradientIcon = null;
              if (item.path === '/note') GradientIcon = GradientFileTextIcon;
              if (item.path === '/profile') GradientIcon = GradientUserIcon;
              if (item.path === '/ranking') GradientIcon = GradientTrophyIcon;
              if (item.path === '/healthlog') GradientIcon = GradientBarChartIcon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'text-primary bg-primary/10'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                >
                  {isActive && GradientIcon ? (
                    <GradientIcon className="h-5 w-5 animate-bounce" />
                  ) : (
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  )}
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="animate-fade-in bg-background text-foreground shadow-xl border border-border rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <DialogTitle className="text-2xl font-bold">문의하기</DialogTitle>
          </div>
          <DialogDescription asChild>
            <div className="text-base text-muted-foreground mb-4">
              관련 문제, 일반적인 지원 요청 등 모든 고객 지원 문의는
              <span className="block my-3">
                <a href="mailto:admin@lifebit.com" className="inline-flex items-center gap-2 px-3 py-2 rounded-lg font-semibold text-[#7c3aed] bg-[#ede9fe] hover:bg-[#e0d7fa] transition-all duration-200 shadow-sm animate-pulse">
                  admin@lifebit.com
                </a>
              </span>
              이메일로 보내주세요.
            </div>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
};
