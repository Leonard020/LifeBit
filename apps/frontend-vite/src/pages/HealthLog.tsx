import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Sparkles, TrendingUp, Target, Calendar, Medal, ChevronLeft, ChevronRight } from 'lucide-react';

const HealthLog = () => {
  const [showAIInsight, setShowAIInsight] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [currentBodyWeek, setCurrentBodyWeek] = useState(0);
  const [macroTab, setMacroTab] = useState('1일');
  const [exerciseTab, setExerciseTab] = useState('일주일');

  // 상단 통계 데이터
  const summaryStats = [
    { 
      label: '주간 평균 칼로리', 
      value: '1,986', 
      unit: 'kcal', 
      icon: TrendingUp, 
      color: 'text-white', 
      bgColor: 'bg-green-500',
      cardBg: 'bg-green-500'
    },
    { 
      label: '목표 달성률', 
      value: '87', 
      unit: '%', 
      icon: Target, 
      color: 'text-white', 
      bgColor: 'bg-blue-500',
      cardBg: 'bg-blue-500'
    },
    { 
      label: '운동 일수', 
      value: '5', 
      unit: '일', 
      icon: Calendar, 
      color: 'text-white', 
      bgColor: 'bg-purple-500',
      cardBg: 'bg-purple-500'
    },
    { 
      label: '현재 랭킹', 
      value: '#42', 
      unit: '', 
      icon: Medal, 
      color: 'text-white', 
      bgColor: 'bg-orange-500',
      cardBg: 'bg-orange-500'
    },
  ];

  // 여러 주차 데이터
  const weeklyData = [
    // 1주차 (06-01 ~ 06-07)
    [
      { date: '06-01', calories: 1800, protein: 120 },
      { date: '06-02', calories: 1950, protein: 130 },
      { date: '06-03', calories: 2100, protein: 125 },
      { date: '06-04', calories: 1850, protein: 115 },
      { date: '06-05', calories: 2200, protein: 140 },
      { date: '06-06', calories: 1900, protein: 120 },
      { date: '06-07', calories: 2050, protein: 135 },
    ],
    // 2주차 (06-08 ~ 06-14)
    [
      { date: '06-08', calories: 1900, protein: 125 },
      { date: '06-09', calories: 2000, protein: 135 },
      { date: '06-10', calories: 1850, protein: 120 },
      { date: '06-11', calories: 2100, protein: 140 },
      { date: '06-12', calories: 1950, protein: 128 },
      { date: '06-13', calories: 2050, protein: 132 },
      { date: '06-14', calories: 1880, protein: 122 },
    ]
  ];

  // 다량영양소 데이터 (기간별)
  const macroDataSets = {
    '1일': [
      { name: '탄수화물', value: 50, color: '#3B82F6' },
      { name: '단백질', value: 30, color: '#10B981' },
      { name: '지방', value: 20, color: '#F59E0B' },
    ],
    '7일': [
      { name: '탄수화물', value: 52, color: '#3B82F6' },
      { name: '단백질', value: 28, color: '#10B981' },
      { name: '지방', value: 20, color: '#F59E0B' },
    ],
    '한달': [
      { name: '탄수화물', value: 48, color: '#3B82F6' },
      { name: '단백질', value: 32, color: '#10B981' },
      { name: '지방', value: 20, color: '#F59E0B' },
    ]
  };

  // 운동 부위별 빈도 데이터 (기간별)
  const exerciseDataSets = {
    '일주일': [
      { bodyPart: '가슴', frequency: 1 },
      { bodyPart: '등', frequency: 0.8 },
      { bodyPart: '어깨', frequency: 0.6 },
      { bodyPart: '하체', frequency: 0.4 },
      { bodyPart: '팔', frequency: 0.3 },
      { bodyPart: '복근', frequency: 0.2 },
    ],
    '한달': [
      { bodyPart: '가슴', frequency: 1 },
      { bodyPart: '등', frequency: 0.9 },
      { bodyPart: '어깨', frequency: 0.7 },
      { bodyPart: '하체', frequency: 0.6 },
      { bodyPart: '팔', frequency: 0.5 },
      { bodyPart: '복근', frequency: 0.4 },
    ]
  };

  // 체중 & 체지방 변화 데이터 (여러 주차)
  const bodyCompositionWeeks = [
    // 1주차
    [
      { day: '월', weight: 70, bodyFat: 18 },
      { day: '화', weight: 69.8, bodyFat: 17.9 },
      { day: '수', weight: 69.7, bodyFat: 17.8 },
      { day: '목', weight: 69.5, bodyFat: 17.7 },
      { day: '금', weight: 69.3, bodyFat: 17.6 },
      { day: '토', weight: 69.2, bodyFat: 17.5 },
      { day: '일', weight: 69.0, bodyFat: 17.4 },
    ],
    // 2주차
    [
      { day: '월', weight: 68.8, bodyFat: 17.3 },
      { day: '화', weight: 68.6, bodyFat: 17.2 },
      { day: '수', weight: 68.4, bodyFat: 17.1 },
      { day: '목', weight: 68.2, bodyFat: 17.0 },
      { day: '금', weight: 68.0, bodyFat: 16.9 },
      { day: '토', weight: 67.8, bodyFat: 16.8 },
      { day: '일', weight: 67.6, bodyFat: 16.7 },
    ]
  ];

  const aiInsights = [
    {
      type: 'positive',
      title: '칼하고 있으신! 이번 주 평균 칼로리 섭취량이 목표에 근접합니다.',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      type: 'info',
      title: '재간: 하체 운동 빈도가 높은 편이네요! 상체 운동도 균형있게 늘려보세요.',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      type: 'warning',
      title: '주의: 목요일 칼로리 섭취량이 높습니다. 내일은 조금 더 조절해보세요.',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const getWeekRange = (weekIndex: number) => {
    const baseDate = new Date(2024, 5, 1); // 2024년 6월 1일
    const startDate = new Date(baseDate);
    startDate.setDate(baseDate.getDate() + (weekIndex * 7));
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const formatDate = (date: Date) => {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${month}-${day}`;
    };
    
    return `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
  };

  const handlePreviousWeek = () => {
    if (currentWeek > 0) {
      setCurrentWeek(currentWeek - 1);
    }
  };

  const handleNextWeek = () => {
    if (currentWeek < weeklyData.length - 1) {
      setCurrentWeek(currentWeek + 1);
    }
  };

  const handlePreviousBodyWeek = () => {
    if (currentBodyWeek > 0) {
      setCurrentBodyWeek(currentBodyWeek - 1);
    }
  };

  const handleNextBodyWeek = () => {
    if (currentBodyWeek < bodyCompositionWeeks.length - 1) {
      setCurrentBodyWeek(currentBodyWeek + 1);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">헬스 로그</h1>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {summaryStats.map((stat, index) => (
            <Card key={index} className={`hover-lift border-0 shadow-lg ${stat.cardBg} text-white rounded-3xl`}>
              <CardContent className="p-6 text-center">
                <div className="flex justify-center mb-4">
                  <stat.icon className="h-8 w-8 text-white" strokeWidth={2.5} />
                </div>
                <div className="text-xs text-white/80 mb-2">{stat.label}</div>
                <div className="text-2xl font-bold">
                  {stat.value}
                  <span className="text-sm font-normal ml-1">
                    {stat.unit}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* AI Insights */}
        <Card className="mb-8 border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center text-primary">
                <Sparkles className="mr-2 h-5 w-5" />
                AI 인사이트
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIInsight(!showAIInsight)}
              >
                {showAIInsight ? '숨기기' : '7일 AI 인사이트 보기'}
              </Button>
            </div>
          </CardHeader>
          {showAIInsight && (
            <CardContent className="space-y-4">
              {aiInsights.map((insight, index) => (
                <div key={index} className={`p-3 rounded-lg ${insight.bgColor}`}>
                  <p className={`text-sm ${insight.color} font-medium`}>{insight.title}</p>
                </div>
              ))}
            </CardContent>
          )}
        </Card>

        {/* Daily Calories Chart */}
        <Card className="mb-8 hover-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>일일 칼로리 섭취량</CardTitle>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handlePreviousWeek}
                  disabled={currentWeek === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {getWeekRange(currentWeek)}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleNextWeek}
                  disabled={currentWeek === weeklyData.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData[currentWeek]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 2500]} />
                  <Tooltip />
                  <Line 
                    type="monotone" 
                    dataKey="calories" 
                    stroke="#3B82F6" 
                    strokeWidth={2} 
                    name="칼로리 섭취량"
                    dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="protein" 
                    stroke="#10B981" 
                    strokeWidth={2} 
                    name="단백질 섭취량"
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Macro Distribution */}
          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>다량영양소</CardTitle>
                <Tabs defaultValue="1일" className="w-auto">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="1일">1일</TabsTrigger>
                    <TabsTrigger value="7일">7일</TabsTrigger>
                    <TabsTrigger value="한달">한달</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="1일" className="w-full">
                <TabsContent value="1일">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={macroDataSets['1일']}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name} ${value}%`}
                        >
                          {macroDataSets['1일'].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                <TabsContent value="7일">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={macroDataSets['7일']}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name} ${value}%`}
                        >
                          {macroDataSets['7일'].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                <TabsContent value="한달">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={macroDataSets['한달']}
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          dataKey="value"
                          label={({ name, value }) => `${name} ${value}%`}
                        >
                          {macroDataSets['한달'].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Exercise Frequency */}
          <Card className="hover-lift">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>운동 부위별 빈도</CardTitle>
                <Tabs defaultValue="일주일" className="w-auto">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="일주일">일주일</TabsTrigger>
                    <TabsTrigger value="한달">한달</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="일주일" className="w-full">
                <TabsContent value="일주일">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={exerciseDataSets['일주일']} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 1]} />
                        <YAxis dataKey="bodyPart" type="category" />
                        <Tooltip />
                        <Bar dataKey="frequency" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
                <TabsContent value="한달">
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={exerciseDataSets['한달']} layout="horizontal">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" domain={[0, 1]} />
                        <YAxis dataKey="bodyPart" type="category" />
                        <Tooltip />
                        <Bar dataKey="frequency" fill="#8B5CF6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Body Composition Chart */}
        <Card className="hover-lift">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>체중 & 체지방 변화</CardTitle>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handlePreviousBodyWeek}
                  disabled={currentBodyWeek === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {getWeekRange(currentBodyWeek)}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleNextBodyWeek}
                  disabled={currentBodyWeek === bodyCompositionWeeks.length - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bodyCompositionWeeks[currentBodyWeek]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="left" orientation="left" domain={[60, 80]} />
                  <YAxis yAxisId="right" orientation="right" domain={[15, 20]} />
                  <Tooltip />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#10B981" 
                    strokeWidth={2} 
                    name="체중 (kg)"
                    dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="bodyFat" 
                    stroke="#F59E0B" 
                    strokeWidth={2} 
                    name="체지방률 (%)"
                    dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default HealthLog;
