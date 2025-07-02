import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { 
  Bell, 
  BellOff, 
  Trophy, 
  Award, 
  Settings, 
  Save, 
  X, 
  RotateCcw,
  Volume2,
  VolumeX,
  Clock,
  Zap,
  Type
} from 'lucide-react';
import { useTheme, FontSize } from '@/contexts/ThemeContext';

interface NotificationSettings {
  allNotifications: boolean;
  rankingNotifications: boolean;
  achievementNotifications: boolean;
  systemNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const NotificationSettings: React.FC = () => {
  const { toast } = useToast();
  
  // 저장된 설정 로드
  const [savedSettings, setSavedSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('notificationSettings');
    return saved ? JSON.parse(saved) : {
      allNotifications: true,
      rankingNotifications: true,
      achievementNotifications: true,
      systemNotifications: true,
      soundEnabled: true,
      vibrationEnabled: true,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00'
    };
  });

  // 임시 설정 (저장 전)
  const [tempSettings, setTempSettings] = useState<NotificationSettings>({ ...savedSettings });

  // 각 카테고리별 변경사항 추적
  const [fontSizeChanged, setFontSizeChanged] = useState(false);
  const [allNotificationsChanged, setAllNotificationsChanged] = useState(false);
  const [individualNotificationsChanged, setIndividualNotificationsChanged] = useState(false);
  const [notificationMethodChanged, setNotificationMethodChanged] = useState(false);
  const [quietHoursChanged, setQuietHoursChanged] = useState(false);

  // 폰트 크기 상태 및 함수
  const {
    tempSettings: themeTempSettings,
    hasUnsavedChanges: themeHasUnsavedChanges,
    setFontSize,
    saveSettings: saveThemeSettings,
    cancelSettings: cancelThemeSettings,
    resetToDefaults: resetThemeDefaults
  } = useTheme();

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean | string) => {
    setTempSettings(prev => ({ ...prev, [key]: value }));
    
    // 변경사항 추적
    if (key === 'allNotifications') {
      setAllNotificationsChanged(true);
    } else if (['rankingNotifications', 'achievementNotifications', 'systemNotifications'].includes(key)) {
      setIndividualNotificationsChanged(true);
    } else if (['soundEnabled', 'vibrationEnabled'].includes(key)) {
      setNotificationMethodChanged(true);
    } else if (['quietHoursEnabled', 'quietHoursStart', 'quietHoursEnd'].includes(key)) {
      setQuietHoursChanged(true);
    }
  };

  // 폰트 크기 변경 핸들러
  const handleFontSizeChange = (size: FontSize) => {
    setFontSize(size);
    setFontSizeChanged(true);
  };

  // 폰트 크기 저장
  const handleFontSizeSave = () => {
    saveThemeSettings();
    setFontSizeChanged(false);
    toast({
      title: '폰트 크기 저장됨',
      description: '폰트 크기가 성공적으로 저장되었습니다.',
    });
  };

  // 폰트 크기 취소
  const handleFontSizeCancel = () => {
    cancelThemeSettings();
    setFontSizeChanged(false);
    toast({
      title: '폰트 크기 변경 취소됨',
      description: '폰트 크기 변경이 취소되었습니다.',
    });
  };

  // 전체 알림 저장
  const handleAllNotificationsSave = () => {
    setSavedSettings(prev => ({ ...prev, allNotifications: tempSettings.allNotifications }));
    localStorage.setItem('notificationSettings', JSON.stringify({
      ...savedSettings,
      allNotifications: tempSettings.allNotifications
    }));
    setAllNotificationsChanged(false);
    toast({
      title: '전체 알림 설정 저장됨',
      description: '전체 알림 설정이 성공적으로 저장되었습니다.',
    });
  };

  // 개별 알림 저장
  const handleIndividualNotificationsSave = () => {
    const newSettings = {
      ...savedSettings,
      rankingNotifications: tempSettings.rankingNotifications,
      achievementNotifications: tempSettings.achievementNotifications,
      systemNotifications: tempSettings.systemNotifications
    };
    setSavedSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    setIndividualNotificationsChanged(false);
    toast({
      title: '개별 알림 설정 저장됨',
      description: '개별 알림 설정이 성공적으로 저장되었습니다.',
    });
  };

  // 알림 방식 저장
  const handleNotificationMethodSave = () => {
    const newSettings = {
      ...savedSettings,
      soundEnabled: tempSettings.soundEnabled,
      vibrationEnabled: tempSettings.vibrationEnabled
    };
    setSavedSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    setNotificationMethodChanged(false);
    toast({
      title: '알림 방식 설정 저장됨',
      description: '알림 방식 설정이 성공적으로 저장되었습니다.',
    });
  };

  // 방해 금지 시간 저장
  const handleQuietHoursSave = () => {
    const newSettings = {
      ...savedSettings,
      quietHoursEnabled: tempSettings.quietHoursEnabled,
      quietHoursStart: tempSettings.quietHoursStart,
      quietHoursEnd: tempSettings.quietHoursEnd
    };
    setSavedSettings(newSettings);
    localStorage.setItem('notificationSettings', JSON.stringify(newSettings));
    setQuietHoursChanged(false);
    toast({
      title: '방해 금지 시간 설정 저장됨',
      description: '방해 금지 시간 설정이 성공적으로 저장되었습니다.',
    });
  };

  // 폰트 크기 옵션
  const fontSizes = [
    { value: 'small', label: '보통', size: 'text-base' },
    { value: 'normal', label: '크게', size: 'text-lg' },
  ];

  const notificationTypes = [
    {
      key: 'rankingNotifications' as keyof NotificationSettings,
      label: '랭킹 알림',
      description: '랭킹 변화, 순위 상승/하락 알림',
      icon: Trophy,
      color: 'bg-yellow-500'
    },
    {
      key: 'achievementNotifications' as keyof NotificationSettings,
      label: '업적 알림',
      description: '새로운 업적 달성, 배지 획득 알림',
      icon: Award,
      color: 'bg-purple-500'
    },
    {
      key: 'systemNotifications' as keyof NotificationSettings,
      label: '시스템 알림',
      description: '앱 업데이트, 유지보수, 중요 공지 알림',
      icon: Settings,
      color: 'bg-blue-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 폰트 크기 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            폰트 크기
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row gap-4 justify-center mb-4">
            {fontSizes.map((size) => (
              <Button
                key={size.value}
                variant={themeTempSettings.fontSize === size.value ? 'default' : 'outline'}
                onClick={() => handleFontSizeChange(size.value as FontSize)}
                className="h-20 w-32 flex flex-col items-center justify-center gap-3 text-xl"
              >
                <div className={`${size.size} font-bold text-2xl`}>Aa</div>
                <span className="text-base font-semibold">{size.label}</span>
              </Button>
            ))}
          </div>
          {fontSizeChanged && (
            <div className="flex justify-end gap-2">
              <Button
                onClick={handleFontSizeCancel}
                variant="outline"
                className="flex items-center gap-2"
                size="sm"
              >
                <X className="h-4 w-4" />
                취소
              </Button>
              <Button
                onClick={handleFontSizeSave}
                className="flex items-center gap-2"
                size="sm"
              >
                <Save className="h-4 w-4" />
                폰트 크기 저장
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 전체 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {tempSettings.allNotifications ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
            전체 알림
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="all-notifications" className="text-base font-medium">
                모든 알림 {tempSettings.allNotifications ? '켜기' : '끄기'}
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                모든 알림을 한 번에 켜거나 끕니다
              </p>
            </div>
            <Switch
              id="all-notifications"
              checked={tempSettings.allNotifications}
              onCheckedChange={(checked) => handleSettingChange('allNotifications', checked)}
            />
          </div>
          
          {!tempSettings.allNotifications && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                전체 알림이 꺼져 있습니다. 개별 알림 설정이 비활성화됩니다.
              </p>
            </div>
          )}
          
          {allNotificationsChanged && (
            <div className="flex justify-end">
              <Button
                onClick={handleAllNotificationsSave}
                className="flex items-center gap-2"
                size="sm"
              >
                <Save className="h-4 w-4" />
                전체 알림 설정 저장
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 개별 알림 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            개별 알림 설정
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {notificationTypes.map((type) => (
            <div key={type.key}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${type.color} flex items-center justify-center`}>
                    <type.icon className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <Label htmlFor={type.key} className="text-base font-medium">
                      {type.label}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {type.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={type.key}
                  checked={tempSettings[type.key] as boolean && tempSettings.allNotifications}
                  onCheckedChange={(checked) => handleSettingChange(type.key, checked)}
                  disabled={!tempSettings.allNotifications}
                />
              </div>
              {type.key !== 'systemNotifications' && <Separator className="mt-4" />}
            </div>
          ))}
          
          {individualNotificationsChanged && (
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleIndividualNotificationsSave}
                className="flex items-center gap-2"
                size="sm"
              >
                <Save className="h-4 w-4" />
                개별 알림 설정 저장
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 알림 방식 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            알림 방식
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              <div>
                <Label htmlFor="sound-enabled">소리</Label>
                <p className="text-sm text-muted-foreground">알림 소리 재생</p>
              </div>
            </div>
            <Switch
              id="sound-enabled"
              checked={tempSettings.soundEnabled}
              onCheckedChange={(checked) => handleSettingChange('soundEnabled', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <div>
                <Label htmlFor="vibration-enabled">진동</Label>
                <p className="text-sm text-muted-foreground">알림 진동</p>
              </div>
            </div>
            <Switch
              id="vibration-enabled"
              checked={tempSettings.vibrationEnabled}
              onCheckedChange={(checked) => handleSettingChange('vibrationEnabled', checked)}
            />
          </div>
          
          {notificationMethodChanged && (
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleNotificationMethodSave}
                className="flex items-center gap-2"
                size="sm"
              >
                <Save className="h-4 w-4" />
                알림 방식 설정 저장
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 방해 금지 시간 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            방해 금지 시간
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="quiet-hours-enabled">방해 금지 모드</Label>
              <p className="text-sm text-muted-foreground">
                지정된 시간 동안 알림을 받지 않습니다
              </p>
            </div>
            <Switch
              id="quiet-hours-enabled"
              checked={tempSettings.quietHoursEnabled}
              onCheckedChange={(checked) => handleSettingChange('quietHoursEnabled', checked)}
            />
          </div>
          
          {tempSettings.quietHoursEnabled && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="quiet-hours-start" className="text-sm">시작 시간</Label>
                <input
                  id="quiet-hours-start"
                  type="time"
                  value={tempSettings.quietHoursStart}
                  onChange={(e) => handleSettingChange('quietHoursStart', e.target.value)}
                  className="mt-1 w-full p-2 border rounded-md bg-background"
                />
              </div>
              <div>
                <Label htmlFor="quiet-hours-end" className="text-sm">종료 시간</Label>
                <input
                  id="quiet-hours-end"
                  type="time"
                  value={tempSettings.quietHoursEnd}
                  onChange={(e) => handleSettingChange('quietHoursEnd', e.target.value)}
                  className="mt-1 w-full p-2 border rounded-md bg-background"
                />
              </div>
            </div>
          )}
          
          {quietHoursChanged && (
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleQuietHoursSave}
                className="flex items-center gap-2"
                size="sm"
              >
                <Save className="h-4 w-4" />
                방해 금지 시간 설정 저장
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 전체 초기화 버튼 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => {
                const defaultSettings = {
                  allNotifications: true,
                  rankingNotifications: true,
                  achievementNotifications: true,
                  systemNotifications: true,
                  soundEnabled: true,
                  vibrationEnabled: true,
                  quietHoursEnabled: false,
                  quietHoursStart: '22:00',
                  quietHoursEnd: '08:00'
                };
                setTempSettings(defaultSettings);
                setSavedSettings(defaultSettings);
                localStorage.setItem('notificationSettings', JSON.stringify(defaultSettings));
                resetThemeDefaults();
                setFontSizeChanged(false);
                setAllNotificationsChanged(false);
                setIndividualNotificationsChanged(false);
                setNotificationMethodChanged(false);
                setQuietHoursChanged(false);
                toast({
                  title: '기본값으로 초기화',
                  description: '모든 설정이 기본값으로 초기화되었습니다.',
                });
              }}
              className="flex items-center gap-2"
            >
              <RotateCcw className="h-4 w-4" />
              모든 설정 초기화
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationSettings; 