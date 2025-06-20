/**
 * AI 시스템 구축 로드맵 컴포넌트
 * - Airflow 파이프라인 구축 계획
 * - 머신러닝 모델 개발 로드맵
 * - 구현 일정 및 진행 상황 관리
 */

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Brain, 
  Database, 
  Cog, 
  BarChart3, 
  Calendar, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  PlayCircle,
  Settings,
  TrendingUp,
  Target,
  Zap,
  Users,
  Shield,
  Cpu
} from 'lucide-react';
import { AI_SYSTEM_ROADMAP } from '../../api/analyticsApi';

interface RoadmapPhase {
  id: string;
  title: string;
  description: string;
  status: 'planned' | 'in_progress' | 'completed' | 'blocked';
  progress: number;
  startDate: string;
  endDate: string;
  components: Array<{
    name: string;
    status: 'planned' | 'in_progress' | 'completed';
    assignee?: string;
  }>;
  dependencies?: string[];
  technologies: string[];
}

const AI_ROADMAP_PHASES: RoadmapPhase[] = [
  {
    id: 'phase1',
    title: 'Airflow 데이터 파이프라인 구축',
    description: '건강 데이터의 효율적 수집, 처리, 저장을 위한 ETL 파이프라인 구축',
    status: 'planned',
    progress: 0,
    startDate: '2024-01-15',
    endDate: '2024-03-15',
    components: [
      { name: 'ETL 파이프라인 설계', status: 'planned' },
      { name: '데이터 품질 검증 시스템', status: 'planned' },
      { name: '실시간 데이터 수집 구현', status: 'planned' },
      { name: '데이터 웨어하우스 구축', status: 'planned' },
      { name: '데이터 카탈로그 시스템', status: 'planned' },
      { name: '모니터링 및 알림 시스템', status: 'planned' }
    ],
    technologies: []
  },
  {
    id: 'phase2',
    title: '머신러닝 모델 개발',
    description: '개인화된 건강 분석 및 예측을 위한 AI 모델 개발',
    status: 'planned',
    progress: 0,
    startDate: '2024-02-01',
    endDate: '2024-05-31',
    components: [
      { name: '건강 패턴 분석 모델', status: 'planned' },
      { name: '체중 예측 모델', status: 'planned' },
      { name: '개인화 추천 알고리즘', status: 'planned' },
      { name: '이상 패턴 감지 모델', status: 'planned' },
      { name: '모델 검증 및 테스트', status: 'planned' },
      { name: '하이퍼파라미터 튜닝', status: 'planned' }
    ],
    dependencies: ['phase1'],
    technologies: []
  },
  {
    id: 'phase3',
    title: 'AI 서비스 배포 및 운영',
    description: 'ML 모델의 프로덕션 배포 및 지속적 운영 시스템 구축',
    status: 'planned',
    progress: 0,
    startDate: '2024-05-01',
    endDate: '2024-07-31',
    components: [
      { name: 'ML 모델 서빙 시스템', status: 'planned' },
      { name: 'A/B 테스트 프레임워크', status: 'planned' },
      { name: '성능 모니터링 시스템', status: 'planned' },
      { name: '지속적 학습 파이프라인', status: 'planned' },
      { name: '모델 버전 관리', status: 'planned' },
      { name: '자동화된 재훈련 시스템', status: 'planned' }
    ],
    dependencies: ['phase2'],
    technologies: []
  },
  {
    id: 'phase4',
    title: '고급 AI 기능 구현',
    description: '심화된 AI 기능 및 사용자 경험 개선',
    status: 'planned',
    progress: 0,
    startDate: '2024-07-01',
    endDate: '2024-10-31',
    components: [
      { name: '대화형 AI 헬스 코치', status: 'planned' },
      { name: '컴퓨터 비전 기반 운동 분석', status: 'planned' },
      { name: '음성 인식 건강 로깅', status: 'planned' },
      { name: '예측적 건강 위험 알림', status: 'planned' },
      { name: '커뮤니티 기반 추천', status: 'planned' },
      { name: '웨어러블 디바이스 연동', status: 'planned' }
    ],
    dependencies: ['phase3'],
    technologies: []
  }
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case 'in_progress':
      return <PlayCircle className="h-4 w-4 text-blue-600" />;
    case 'blocked':
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'in_progress':
      return 'bg-blue-100 text-blue-800';
    case 'blocked':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const AISystemRoadmap: React.FC = () => {
  const [selectedPhase, setSelectedPhase] = useState<string>('phase1');

  const currentPhase = AI_ROADMAP_PHASES.find(phase => phase.id === selectedPhase);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI 시스템 구축 로드맵</h1>
          <p className="text-gray-600 mt-1">
            Airflow 파이프라인부터 머신러닝 모델까지 단계별 구현 계획
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          v1.0 계획안
        </Badge>
      </div>

      {/* 전체 진행률 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            전체 진행 현황
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>총 진행률</span>
              <span>5%</span>
            </div>
            <Progress value={5} className="h-2" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-400">0/4</p>
                <p className="text-gray-600">완료된 단계</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">1</p>
                <p className="text-gray-600">진행 중</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">3</p>
                <p className="text-gray-600">계획됨</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">8개월</p>
                <p className="text-gray-600">예상 기간</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 단계별 상세 */}
      <Tabs value={selectedPhase} onValueChange={setSelectedPhase}>
        <TabsList className="grid grid-cols-4 w-full">
          {AI_ROADMAP_PHASES.map((phase) => (
            <TabsTrigger 
              key={phase.id} 
              value={phase.id}
              className="text-xs"
            >
              <div className="flex items-center gap-1">
                {getStatusIcon(phase.status)}
                Phase {phase.id.slice(-1)}
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {AI_ROADMAP_PHASES.map((phase) => (
          <TabsContent key={phase.id} value={phase.id} className="space-y-6">
            {/* 단계 개요 */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    {phase.id === 'phase1' && <Database className="h-5 w-5 mr-2 text-blue-600" />}
                    {phase.id === 'phase2' && <Brain className="h-5 w-5 mr-2 text-purple-600" />}
                    {phase.id === 'phase3' && <Cog className="h-5 w-5 mr-2 text-green-600" />}
                    {phase.id === 'phase4' && <Zap className="h-5 w-5 mr-2 text-orange-600" />}
                    {phase.title}
                  </CardTitle>
                  <Badge className={getStatusColor(phase.status)}>
                    {phase.status === 'planned' && '계획됨'}
                    {phase.status === 'in_progress' && '진행 중'}
                    {phase.status === 'completed' && '완료'}
                    {phase.status === 'blocked' && '차단됨'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">{phase.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">시작일</p>
                    <p className="text-lg">{phase.startDate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">완료 예정</p>
                    <p className="text-lg">{phase.endDate}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">진행률</p>
                    <div className="flex items-center gap-2">
                      <Progress value={phase.progress} className="h-2 flex-1" />
                      <span className="text-sm">{phase.progress}%</span>
                    </div>
                  </div>
                </div>

                {/* 의존성 */}
                {phase.dependencies && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-600 mb-2">의존성</p>
                    <div className="flex gap-2">
                      {phase.dependencies.map((dep) => (
                        <Badge key={dep} variant="outline" className="text-xs">
                          {dep}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}


              </CardContent>
            </Card>

            {/* 구성 요소 */}
            <Card>
              <CardHeader>
                <CardTitle>구현 항목</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {phase.components.map((component, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(component.status)}
                        <span className="font-medium">{component.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {component.assignee && (
                          <Badge variant="outline" className="text-xs">
                            {component.assignee}
                          </Badge>
                        )}
                        <Badge className={getStatusColor(component.status) + ' text-xs'}>
                          {component.status === 'planned' && '계획됨'}
                          {component.status === 'in_progress' && '진행 중'}
                          {component.status === 'completed' && '완료'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* 예상 타임라인 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            구현 타임라인
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {AI_ROADMAP_PHASES.map((phase, index) => (
              <div key={phase.id} className="flex items-center gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-4 h-4 rounded-full ${
                    phase.status === 'completed' ? 'bg-green-500' :
                    phase.status === 'in_progress' ? 'bg-blue-500' :
                    'bg-gray-300'
                  }`} />
                  {index < AI_ROADMAP_PHASES.length - 1 && (
                    <div className="w-0.5 h-8 bg-gray-200 mt-1" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{phase.title}</h3>
                  <p className="text-sm text-gray-600">
                    {phase.startDate} ~ {phase.endDate}
                  </p>
                </div>
                <Badge className={getStatusColor(phase.status)}>
                  {phase.progress}% 완료
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 