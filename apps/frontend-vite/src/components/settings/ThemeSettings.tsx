import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useTheme, ColorScheme, FontSize } from '@/contexts/ThemeContext';
import { Moon, Sun, Monitor, Palette, Type, Eye, Save, X, RotateCcw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const ThemeSettings: React.FC = () => {
  const { toast } = useToast();
  const {
    tempSettings,
    hasUnsavedChanges,
    setThemeMode,
    setFontSize,
    setColorScheme,
    setHighContrast,
    setReduceMotion,
    saveSettings,
    cancelSettings,
    resetToDefaults,
  } = useTheme();

  const colorSchemes = [
    { value: 'default', label: '기본', color: 'bg-gradient-to-r from-purple-500 to-pink-500' },
    { value: 'blue', label: '블루', color: 'bg-gradient-to-r from-blue-500 to-cyan-500' },
    { value: 'green', label: '그린', color: 'bg-gradient-to-r from-green-500 to-emerald-500' },
    { value: 'purple', label: '퍼플', color: 'bg-gradient-to-r from-purple-600 to-indigo-600' },
    { value: 'orange', label: '오렌지', color: 'bg-gradient-to-r from-orange-500 to-red-500' },
  ];

  const fontSizes = [
    { value: 'small', label: '작게', size: 'text-base' },
    { value: 'normal', label: '보통', size: 'text-lg' },
    { value: 'large', label: '크게', size: 'text-xl' },
  ];

  const handleSave = () => {
    saveSettings();
    toast({
      title: '설정 저장됨',
      description: '테마 설정이 성공적으로 저장되었습니다.',
    });
  };

  const handleCancel = () => {
    cancelSettings();
    toast({
      title: '설정 취소됨',
      description: '변경사항이 취소되었습니다.',
    });
  };

  const handleReset = () => {
    resetToDefaults();
    toast({
      title: '기본값으로 초기화',
      description: '모든 설정이 기본값으로 초기화되었습니다.',
    });
  };

  return (
    <div className="space-y-6">
      {/* 테마 모드 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            테마 모드
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant={tempSettings.themeMode === 'light' ? 'default' : 'outline'}
              onClick={() => setThemeMode('light')}
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <Sun className="h-6 w-6" />
              <span>라이트</span>
            </Button>
            <Button
              variant={tempSettings.themeMode === 'dark' ? 'default' : 'outline'}
              onClick={() => setThemeMode('dark')}
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <Moon className="h-6 w-6" />
              <span>다크</span>
            </Button>
            <Button
              variant={tempSettings.themeMode === 'system' ? 'default' : 'outline'}
              onClick={() => setThemeMode('system')}
              className="h-20 flex flex-col items-center justify-center gap-2"
            >
              <Monitor className="h-6 w-6" />
              <span>시스템</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 컬러 스킴 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            컬러 스킴
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {colorSchemes.map((scheme) => (
              <Button
                key={scheme.value}
                variant={tempSettings.colorScheme === scheme.value ? 'default' : 'outline'}
                onClick={() => setColorScheme(scheme.value as ColorScheme)}
                className="h-16 flex flex-col items-center justify-center gap-1 relative"
              >
                <div className={`w-6 h-6 rounded-full ${scheme.color}`} />
                <span className="text-xs">{scheme.label}</span>
                {tempSettings.colorScheme === scheme.value && (
                  <div className="absolute top-1 right-1 w-3 h-3 bg-primary rounded-full" />
                )}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 폰트 크기 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            폰트 크기
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {fontSizes.map((size) => (
              <Button
                key={size.value}
                variant={tempSettings.fontSize === size.value ? 'default' : 'outline'}
                onClick={() => setFontSize(size.value as FontSize)}
                className="h-16 flex flex-col items-center justify-center gap-2"
              >
                <div className={`${size.size} font-medium`}>
                  Aa
                </div>
                <span className="text-xs">{size.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 접근성 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            접근성
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="high-contrast">고대비 모드</Label>
              <p className="text-sm text-muted-foreground">
                텍스트와 배경의 대비를 높여 가독성을 개선합니다
              </p>
            </div>
            <Switch 
              id="high-contrast" 
              checked={tempSettings.highContrast}
              onCheckedChange={setHighContrast}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="reduce-motion">모션 감소</Label>
              <p className="text-sm text-muted-foreground">
                애니메이션과 전환 효과를 줄여 모션 민감성을 고려합니다
              </p>
            </div>
            <Switch 
              id="reduce-motion" 
              checked={tempSettings.reduceMotion}
              onCheckedChange={setReduceMotion}
            />
          </div>
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
                variant="outline"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                기본값
              </Button>
              
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={!hasUnsavedChanges}
                className="flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                취소
              </Button>
              
              <Button
                onClick={handleSave}
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
    </div>
  );
};

export default ThemeSettings; 