import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const Settings: React.FC = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [notificationAll, setNotificationAll] = useState(true);
  const [notificationRanking, setNotificationRanking] = useState(true);
  const [notificationAchievement, setNotificationAchievement] = useState(true);
  const [notificationSystem, setNotificationSystem] = useState(true);
  const [fontSize, setFontSize] = useState('normal');
  const [language, setLanguage] = useState('ko');

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24">
        <h1 className="text-2xl font-bold mb-6">환경설정</h1>
        <Tabs defaultValue="theme" className="w-full max-w-2xl mx-auto">
          <TabsList>
            <TabsTrigger value="theme">테마/화면</TabsTrigger>
            <TabsTrigger value="notification">알림</TabsTrigger>
            <TabsTrigger value="account">계정</TabsTrigger>
            <TabsTrigger value="goal">목표</TabsTrigger>
            <TabsTrigger value="data">데이터/보안</TabsTrigger>
            <TabsTrigger value="etc">기타</TabsTrigger>
          </TabsList>
          <TabsContent value="theme">
            <Card>
              <CardHeader><CardTitle>테마/화면 설정</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <span>다크모드</span>
                  <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <span>폰트 크기</span>
                  <select value={fontSize} onChange={e => setFontSize(e.target.value)} className="border rounded p-1">
                    <option value="small">작게</option>
                    <option value="normal">보통</option>
                    <option value="large">크게</option>
                  </select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="notification">
            <Card>
              <CardHeader><CardTitle>알림 설정</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 mb-4">
                  <span>전체 알림</span>
                  <Switch checked={notificationAll} onCheckedChange={setNotificationAll} />
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <span>랭킹 알림</span>
                  <Switch checked={notificationRanking} onCheckedChange={setNotificationRanking} />
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <span>업적 알림</span>
                  <Switch checked={notificationAchievement} onCheckedChange={setNotificationAchievement} />
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <span>시스템 알림</span>
                  <Switch checked={notificationSystem} onCheckedChange={setNotificationSystem} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="account">
            <Card>
              <CardHeader><CardTitle>계정/개인정보</CardTitle></CardHeader>
              <CardContent>
                <div>비밀번호 변경, 이메일/닉네임 변경, 소셜 연동 등 (추후 구현)</div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="goal">
            <Card>
              <CardHeader><CardTitle>건강 목표/리마인더</CardTitle></CardHeader>
              <CardContent>
                <div>건강 목표 빠른 설정, 목표 리마인더 등 (추후 구현)</div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="data">
            <Card>
              <CardHeader><CardTitle>데이터/보안</CardTitle></CardHeader>
              <CardContent>
                <div>내 데이터 다운로드, 계정 탈퇴, 로그인 이력 등 (추후 구현)</div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="etc">
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