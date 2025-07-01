import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Globe, 
  Info, 
  HelpCircle, 
  MessageSquare, 
  FileText, 
  Shield, 
  ExternalLink,
  Download,
  Monitor,
  Save,
  X,
  RotateCcw
} from 'lucide-react';

interface OtherSettings {
  language: string;
  privacy: {
    dataCollection: boolean;
    analytics: boolean;
    marketing: boolean;
  };
}

const OtherSettings: React.FC = () => {
  const { toast } = useToast();
  
  // 이스터에그 상태
  const [developerClickCount, setDeveloperClickCount] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  
  // 저장된 설정 로드
  const [savedSettings, setSavedSettings] = useState<OtherSettings>(() => {
    const saved = localStorage.getItem('otherSettings');
    return saved ? JSON.parse(saved) : {
      language: 'ko',
      privacy: {
        dataCollection: true,
        analytics: true,
        marketing: false,
      }
    };
  });

  // 임시 설정 (저장 전)
  const [tempSettings, setTempSettings] = useState<OtherSettings>({ ...savedSettings });

  // 설정이 변경되었는지 확인
  const hasUnsavedChanges = JSON.stringify(tempSettings) !== JSON.stringify(savedSettings);

  // 현재 날짜를 YYYY.MM.DDD 형식으로 포맷
  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 현재 날짜를 YYYY-MM-DD 형식으로 포맷
  const getCurrentDateFormatted = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 개발자 클릭 이벤트 핸들러
  const handleDeveloperClick = () => {
    const newCount = developerClickCount + 1;
    setDeveloperClickCount(newCount);
    
    if (newCount === 10) {
      setShowEasterEgg(true);
      toast({
        title: '🎉 이스터에그 발견!',
        description: '개발팀 멤버들을 확인해보세요!',
      });
    } else if (newCount > 10) {
      setShowEasterEgg(false);
      setDeveloperClickCount(0);
    }
  };

  const handleSettingChange = (category: keyof OtherSettings, key: string, value: boolean | string) => {
    setTempSettings(prev => {
      if (category === 'language') {
        return {
          ...prev,
          language: value as string
        };
      } else if (category === 'privacy') {
        return {
          ...prev,
          privacy: {
            ...prev.privacy,
            [key]: value as boolean
          }
        };
      }
      return prev;
    });
  };

  const handleSave = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setSavedSettings(tempSettings);
    localStorage.setItem('otherSettings', JSON.stringify(tempSettings));
    toast({
      title: '설정 저장됨',
      description: '기타 설정이 성공적으로 저장되었습니다.',
    });
  };

  const handleCancel = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    setTempSettings(savedSettings);
    toast({
      title: '설정 취소됨',
      description: '변경사항이 취소되었습니다.',
    });
  };

  const handleReset = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const defaultSettings = {
      language: 'ko',
      privacy: {
        dataCollection: true,
        analytics: true,
        marketing: false,
      }
    };
    setTempSettings(defaultSettings);
    toast({
      title: '기본값으로 초기화',
      description: '모든 기타 설정이 기본값으로 초기화되었습니다.',
    });
  };

  const appInfo = {
    version: '1.0.0',
    buildNumber: getCurrentDate(),
    developer: 'LifeBit Team',
    lastUpdate: getCurrentDateFormatted()
  };

  // 개발팀 멤버 목록 (ㄱㄴㄷ순)
  const teamMembers = [
    '김성현',
    '남궁현', 
    '박병규',
    '백승빈',
    '손찬우',
    '이민호',
    '이지섭',
    '문경민'
  ];

  const supportLinks = [
    {
      title: '자주 묻는 질문',
      description: 'FAQ를 통해 문제를 해결해보세요',
      icon: HelpCircle,
      action: () => window.open('/faq', '_blank')
    },
    {
      title: '문의하기',
      description: '고객센터에 문의하세요',
      icon: MessageSquare,
      action: () => window.open('/contact', '_blank')
    },
    {
      title: '피드백 보내기',
      description: '앱 개선을 위한 의견을 보내주세요',
      icon: MessageSquare,
      action: () => window.open('/feedback', '_blank')
    }
  ];

  const legalLinks = [
    {
      title: '개인정보 처리방침',
      description: '개인정보 수집 및 이용에 대한 안내',
      icon: Shield,
      action: () => window.open('/privacy', '_blank')
    },
    {
      title: '이용약관',
      description: '서비스 이용에 대한 약관',
      icon: FileText,
      action: () => window.open('/terms', '_blank')
    }
  ];

  return (
    <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
      {/* 앱 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            앱 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">버전</span>
              <Badge variant="secondary">{appInfo.version}</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">빌드 번호</span>
              <Badge variant="outline">{appInfo.buildNumber}</Badge>
            </div>
            <div 
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg cursor-pointer hover:bg-muted/70 transition-colors"
              onClick={handleDeveloperClick}
            >
              <span className="text-sm font-medium">개발자</span>
              <span className="text-sm text-muted-foreground">{appInfo.developer}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <span className="text-sm font-medium">최종 업데이트</span>
              <span className="text-sm text-muted-foreground">{appInfo.lastUpdate}</span>
            </div>
          </div>
          
          {/* 이스터에그: 개발팀 멤버 목록 */}
          {showEasterEgg && (
            <div className="mt-4 p-4 bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
              <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                🎉 LifeBit 개발팀
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {teamMembers.map((member, index) => (
                  <div 
                    key={index}
                    className="text-sm text-purple-700 dark:text-purple-300 bg-white/50 dark:bg-purple-900/30 px-2 py-1 rounded text-center"
                  >
                    {member}
                  </div>
                ))}
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 text-center">
                다시 클릭하면 숨겨집니다
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 언어 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            언어 설정
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Label htmlFor="language-select" className="text-base font-medium">
              언어 선택
            </Label>
            <select
              id="language-select"
              value={tempSettings.language}
              onChange={(e) => handleSettingChange('language', 'language', e.target.value)}
              className="w-full p-3 border rounded-lg bg-background"
            >
              <option value="ko">한국어</option>
              <option value="en">English</option>
            </select>
            <p className="text-sm text-muted-foreground">
              언어 변경 시 앱이 재시작될 수 있습니다.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 개인정보 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            개인정보 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <div>
                <Label htmlFor="data-collection">데이터 수집</Label>
                <p className="text-sm text-muted-foreground">서비스 개선을 위한 데이터 수집</p>
              </div>
            </div>
            <input
              id="data-collection"
              type="checkbox"
              checked={tempSettings.privacy.dataCollection}
              onChange={(e) => handleSettingChange('privacy', 'dataCollection', e.target.checked)}
              className="w-4 h-4"
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Monitor className="h-4 w-4" />
              <div>
                <Label htmlFor="analytics">분석 데이터</Label>
                <p className="text-sm text-muted-foreground">사용 패턴 분석을 위한 데이터</p>
              </div>
            </div>
            <input
              id="analytics"
              type="checkbox"
              checked={tempSettings.privacy.analytics}
              onChange={(e) => handleSettingChange('privacy', 'analytics', e.target.checked)}
              className="w-4 h-4"
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              <div>
                <Label htmlFor="marketing">마케팅 정보</Label>
                <p className="text-sm text-muted-foreground">마케팅 및 프로모션 정보 수신</p>
              </div>
            </div>
            <input
              id="marketing"
              type="checkbox"
              checked={tempSettings.privacy.marketing}
              onChange={(e) => handleSettingChange('privacy', 'marketing', e.target.checked)}
              className="w-4 h-4"
            />
          </div>
        </CardContent>
      </Card>

      {/* 고객센터 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            고객센터
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {supportLinks.map((link, index) => (
            <div key={index}>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={link.action}
              >
                <div className="flex items-center gap-3">
                  <link.icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">{link.title}</div>
                    <div className="text-sm text-muted-foreground">{link.description}</div>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </div>
              </Button>
              {index < supportLinks.length - 1 && <Separator className="my-3" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 법적 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            법적 정보
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {legalLinks.map((link, index) => (
            <div key={index}>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={link.action}
              >
                <div className="flex items-center gap-3">
                  <link.icon className="h-5 w-5" />
                  <div className="text-left">
                    <div className="font-medium">{link.title}</div>
                    <div className="text-sm text-muted-foreground">{link.description}</div>
                  </div>
                  <ExternalLink className="h-4 w-4 ml-auto" />
                </div>
              </Button>
              {index < legalLinks.length - 1 && <Separator className="my-3" />}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 저장/취소 버튼 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {hasUnsavedChanges && (
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                  변경사항이 있습니다
                </span>
              )}
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={(e) => handleReset(e)}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                기본값
              </Button>
              
              <Button
                type="button"
                variant="outline"
                onClick={(e) => handleCancel(e)}
                disabled={!hasUnsavedChanges}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                취소
              </Button>
              
              <Button
                type="button"
                onClick={(e) => handleSave(e)}
                disabled={!hasUnsavedChanges}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                저장
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </form>
  );
};

export default OtherSettings; 