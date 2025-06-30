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
    { value: 'small', label: '보통', size: 'text-base' },
    { value: 'normal', label: '크게', size: 'text-lg' },
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
      {/* 폰트 크기 설정 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5" />
            폰트 크기
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-row gap-4 justify-center">
            {fontSizes.map((size) => (
              <Button
                key={size.value}
                variant={tempSettings.fontSize === size.value ? 'default' : 'outline'}
                onClick={() => setFontSize(size.value as FontSize)}
                className="h-20 w-32 flex flex-col items-center justify-center gap-3 text-xl"
              >
                <div className={`${size.size} font-bold text-2xl`}>Aa</div>
                <span className="text-base font-semibold">{size.label}</span>
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

      {/* 저장/취소 버튼 (Card로 감싸기) */}
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