import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24">
        <h1 className="text-2xl font-bold mb-6">환경설정</h1>
        <div className="w-full max-w-6xl mx-auto mt-10">
          <NotificationSettings />
        </div>
      </div>
    </Layout>
  );
};

export default Settings; 