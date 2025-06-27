import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, Mail, Ruler, Weight, Calendar, Lock, Eye, EyeOff, Check } from 'lucide-react';

interface ProfileData {
  nickname: string;
  email: string;
  height: string;
  weight: string;
  age: string;
  gender: string;
  profileImageUrl?: string;
}

interface BasicInfoBoxProps {
  profileData: ProfileData;
  setProfileData: (data: ProfileData) => void;
  loading: boolean;
  onSave: () => void;
  onUnregister?: () => void;
  password?: string;
  setPassword?: (value: string) => void;
  confirmPassword?: string;
  setConfirmPassword?: (value: string) => void;
  showPassword?: boolean;
  setShowPassword?: (value: boolean) => void;
  showConfirmPassword?: boolean;
  setShowConfirmPassword?: (value: boolean) => void;
  nicknameEditable?: boolean;
  disablePasswordFields?: boolean;
}

export const BasicInfoBox: React.FC<BasicInfoBoxProps> = ({
  profileData,
  setProfileData,
  loading,
  onSave,
  onUnregister,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  nicknameEditable = false,
  disablePasswordFields = false,
}) => (
  <Card className="hover-lift">
    <CardHeader>
      <CardTitle className="flex items-center">
        <User className="mr-2 h-5 w-5" />
        기본 정보
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="nickname">닉네임</Label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="nickname"
              value={profileData.nickname}
              readOnly={!nicknameEditable}
              onChange={nicknameEditable ? (e) => setProfileData({ ...profileData, nickname: e.target.value }) : undefined}
              className={`pl-10 ${nicknameEditable ? '' : 'bg-gray-50 cursor-not-allowed'}`}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">이메일</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              value={profileData.email}
              readOnly
              className="pl-10 bg-gray-50 cursor-not-allowed"
            />
          </div>
        </div>
        {/* Password fields only if not disabled and setPassword etc. are provided */}
        {!disablePasswordFields && setPassword && setConfirmPassword && setShowPassword && setShowConfirmPassword && (
          <>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="새 비밀번호를 입력하세요"
                  className="pl-10 pr-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="비밀번호를 다시 입력하세요"
                  className="pl-10 pr-10"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                {confirmPassword && password === confirmPassword && (
                  <Check className="absolute right-10 top-3 h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
          </>
        )}
        {/* End password fields */}
        <div className="space-y-2">
          <Label htmlFor="height">키 (cm)</Label>
          <div className="relative">
            <Ruler className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="height"
              type="number"
              value={profileData.height}
              onChange={(e) => setProfileData({ ...profileData, height: e.target.value })}
              className="pl-10"
              onWheel={e => e.currentTarget.blur()}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">체중 (kg)</Label>
          <div className="relative">
            <Weight className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="weight"
              type="number"
              value={profileData.weight}
              onChange={(e) => setProfileData({ ...profileData, weight: e.target.value })}
              className="pl-10"
              onWheel={e => e.currentTarget.blur()}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="age">나이</Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="age"
              type="number"
              value={profileData.age}
              onChange={(e) => setProfileData({ ...profileData, age: e.target.value })}
              className="pl-10"
              onWheel={e => e.currentTarget.blur()}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="gender">성별</Label>
          <Select value={profileData.gender} onValueChange={(value) => setProfileData({ ...profileData, gender: value })}>
            <SelectTrigger>
              <SelectValue placeholder="성별을 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">남성</SelectItem>
              <SelectItem value="female">여성</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <Button onClick={onSave} disabled={loading} className="w-full gradient-bg hover:opacity-90 transition-opacity">
        {loading ? '저장 중...' : '기본 정보 저장'}
      </Button>
      {onUnregister && (
        <Button onClick={onUnregister} disabled={loading} variant="destructive" className="w-full mt-2">
          회원탈퇴
        </Button>
      )}
    </CardContent>
  </Card>
); 