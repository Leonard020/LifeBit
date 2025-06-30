import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ThemeSettings from '@/components/settings/ThemeSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import { 
  Palette, 
  Bell, 
  User, 
  Target, 
  Shield, 
  Settings as SettingsIcon,
  PaletteIcon,
  BellIcon,
  UserIcon,
  TargetIcon,
  ShieldIcon,
  Settings2
} from 'lucide-react';

const Settings: React.FC = () => {
  const [language, setLanguage] = useState('ko');

  const tabItems = [
    {
      value: 'theme',
      label: '테마',
      icon: Palette,
      hoverIcon: PaletteIcon
    },
    {
      value: 'notification',
      label: '알림',
      icon: Bell,
      hoverIcon: BellIcon
    },
    {
      value: 'account',
      label: '계정',
      icon: User,
      hoverIcon: UserIcon
    },
    {
      value: 'goal',
      label: '목표',
      icon: Target,
      hoverIcon: TargetIcon
    },
    {
      value: 'data',
      label: '보안',
      icon: Shield,
      hoverIcon: ShieldIcon
    },
    {
      value: 'etc',
      label: '기타',
      icon: Settings,
      hoverIcon: Settings2
    }
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24">
        <h1 className="text-2xl font-bold mb-6">환경설정</h1>
        <Tabs defaultValue="theme" className="w-full max-w-6xl mx-auto">
          <TabsList className="flex w-full flex-wrap gap-2 p-2 justify-center bg-background/50 backdrop-blur-sm">
            {tabItems.map((tab) => (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="group relative transition-all duration-300 hover:scale-105 hover:shadow-md settings-tab-hover text-sm md:text-base h-12 md:h-14 px-3 md:px-6 whitespace-nowrap flex-shrink-0 rounded-lg border border-border/50"
              >
                <div className="relative w-full h-full flex items-center justify-center">
                  <span className="group-hover:opacity-0 group-hover:scale-90 transition-all duration-300 text-center leading-tight settings-tab-text">
                    {tab.label}
                  </span>
                  <tab.hoverIcon className="opacity-0 group-hover:opacity-100 group-hover:scale-110 h-4 w-4 md:h-5 md:w-5 transition-all duration-300 absolute inset-0 m-auto settings-tab-icon" />
                </div>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <TabsContent value="theme" className="mt-6">
            <ThemeSettings />
          </TabsContent>
          
          <TabsContent value="notification" className="mt-6">
            <NotificationSettings />
          </TabsContent>
          
          <TabsContent value="account" className="mt-6">
            <Card>
              <CardHeader><CardTitle>계정/개인정보</CardTitle></CardHeader>
              <CardContent>
                <div>비밀번호 변경, 이메일/닉네임 변경, 소셜 연동 등 (추후 구현)</div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="goal" className="mt-6">
            <Card>
              <CardHeader><CardTitle>건강 목표/리마인더</CardTitle></CardHeader>
              <CardContent>
                <div>건강 목표 빠른 설정, 목표 리마인더 등 (추후 구현)</div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="data" className="mt-6">
            <Card>
              <CardHeader><CardTitle>데이터/보안</CardTitle></CardHeader>
              <CardContent>
                <div>내 데이터 다운로드, 계정 탈퇴, 로그인 이력 등 (추후 구현)</div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="etc" className="mt-6">
            <Card>
              <CardHeader><CardTitle>기타</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <span>언어</span>
                  <select value={language} onChange={e => setLanguage(e.target.value)} className="border rounded p-1">
                    <option value="ko">한국어</option>
                    <option value="en">English</option>
                  </select>
                </div>
                <div>앱 정보, 접근성, 고객센터 등 (추후 구현)</div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Settings; 