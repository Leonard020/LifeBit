import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award, TrendingUp, Calendar, Target, Loader2 } from 'lucide-react';
import { getRanking } from '@/api/auth';
import { getToken, getUserInfo } from '@/utils/auth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';

interface RankingUser {
  rank: number;
  userId: number;
  nickname: string;
  score: number;
  badge: string;
  streakDays: number;
}

interface MyRanking {
  rank: number;
  score: number;
  streakDays: number;
  totalUsers: number;
}

interface Achievement {
  title: string;
  description: string;
  badge: string;
  achieved: boolean;
  date?: string;
  progress: number;
  target?: number;
}

interface RankingData {
  topRankers: RankingUser[];
  myRanking: MyRanking;
  achievements: Achievement[];
}

const Ranking = () => {
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);

  useEffect(() => {
    const fetchRankingData = async () => {
      try {
        const token = getToken();
        const userInfo = getUserInfo();
        
        console.log('=== Debug Information ===');
        console.log('Debug - Token exists:', !!token);
        console.log('Debug - UserInfo exists:', !!userInfo);
        console.log('Debug - Token preview:', token ? token.substring(0, 50) + '...' : 'No token');
        console.log('Debug - UserInfo:', userInfo);
        console.log('Debug - localStorage auth_token:', localStorage.getItem('auth_token'));
        console.log('Debug - localStorage user_info:', localStorage.getItem('user_info'));
        console.log('=========================');
        
        setLoading(true);
        setError(null);
        
        try {
          console.log('Debug - About to call getRanking API');
          const data = await getRanking();
          console.log('Debug - getRanking API response:', data);
          setRankingData(data);
        } catch (apiError) {
          console.log('Debug - API call failed:', apiError);
          setError('랭킹 데이터를 불러올 수 없습니다. 인터넷 연결을 확인하거나 나중에 다시 시도해주세요.');
          toast.error('랭킹 데이터를 불러오는데 실패했습니다.');
        }
      } catch (error) {
        console.error('Failed to fetch ranking data:', error);
        console.log('Debug - Error details:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        setError('랭킹 데이터를 불러오는데 실패했습니다.');
        toast.error('랭킹 데이터를 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchRankingData();
  }, [navigate]);

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'platinum': return 'bg-gradient-to-r from-gray-300 to-gray-100 text-gray-800';
      case 'gold': return 'bg-gradient-to-r from-yellow-400 to-yellow-200 text-yellow-800';
      case 'silver': return 'bg-gradient-to-r from-gray-400 to-gray-200 text-gray-800';
      case 'bronze': return 'bg-gradient-to-r from-orange-400 to-orange-200 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-orange-600" />;
    return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 pb-24">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">랭킹 데이터를 불러오는 중...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 pb-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">랭킹</h1>
            <p className="text-red-500">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
            >
              다시 시도
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!rankingData) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8 pb-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">랭킹</h1>
            <p className="text-muted-foreground">랭킹 데이터가 없습니다.</p>
          </div>
        </div>
      </Layout>
    );
  }

  const { topRankers, myRanking, achievements } = rankingData;

  // 데이터가 없을 때 안내 메시지 표시
  const hasNoData = topRankers.length === 0 && myRanking.rank === 0 && achievements.length === 0;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">랭킹</h1>
          <p className="text-muted-foreground">사용자들과 함께 건강한 경쟁을 즐겨보세요</p>
        </div>

        {/* 데이터가 없을 때 안내 메시지 */}
        {hasNoData && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-xl font-semibold mb-2">아직 랭킹 데이터가 없습니다</h3>
            <p className="text-muted-foreground mb-6">
              건강 기록을 시작하고 다른 사용자들과 함께 경쟁해보세요!
            </p>
            <div className="space-y-2 text-sm text-muted-foreground max-w-md mx-auto">
              <p>• 꾸준한 운동과 기록으로 점수를 획득하세요</p>
              <p>• 연속 기록 일수를 늘려 더 높은 순위에 도전하세요</p>
              <p>• 다양한 업적을 달성하여 배지를 수집하세요</p>
            </div>
          </div>
        )}

        {/* My Ranking */}
        {!hasNoData && (
          <Card className="mb-8 border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <Trophy className="mr-2 h-5 w-5 text-primary" />
                나의 랭킹
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center space-x-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold gradient-text">{myRanking.rank || '-'}</div>
                    <div className="text-sm text-muted-foreground">순위</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold">{myRanking.score.toLocaleString()}</div>
                    <div className="text-sm text-muted-foreground">점수</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{myRanking.streakDays}</div>
                    <div className="text-sm text-muted-foreground">연속 기록</div>
                  </div>
                </div>
                {myRanking.totalUsers > 0 && (
                  <p className="text-sm text-muted-foreground">
                    전체 {myRanking.totalUsers.toLocaleString()}명 중 {myRanking.rank}위
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top Rankers */}
        {!hasNoData && topRankers.length > 0 && (
          <Card className="mb-8 hover-lift">
            <CardHeader>
              <CardTitle>상위 랭킹</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topRankers.map((user: RankingUser) => (
                  <div key={user.rank} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 flex items-center justify-center">
                        {getRankIcon(user.rank)}
                      </div>
                      <Avatar>
                        <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-bold">
                            {user.nickname.charAt(0)}
                          </span>
                        </div>
                        <AvatarFallback>{user.nickname.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.nickname}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.streakDays}일 연속
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{user.score.toLocaleString()}점</div>
                      <Badge className={`text-xs ${getBadgeColor(user.badge)}`}>
                        {user.badge}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Achievement Badges */}
        {!hasNoData && achievements.length > 0 && (
          <Card className="hover-lift">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="mr-2 h-5 w-5" />
                활동 뱃지
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement: Achievement, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${achievement.achieved ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'} cursor-pointer hover:shadow-lg hover:border-primary transition`}
                    onClick={() => { setSelectedAchievement(achievement); setDrawerOpen(true); }}
                    tabIndex={0}
                    role="button"
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { setSelectedAchievement(achievement); setDrawerOpen(true); } }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h4 className={`font-medium ${achievement.achieved ? 'text-green-800' : 'text-gray-700'}`}>{achievement.title}</h4>
                        <p className={`text-sm ${achievement.achieved ? 'text-green-600' : 'text-gray-500'}`}>{achievement.description}</p>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            className={`${getBadgeColor(achievement.badge)} ml-2 text-xs px-2 py-0.5`}
                          >
                            {achievement.badge}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div>
                            <div className="font-bold">{achievement.title}</div>
                            <div className="text-xs text-muted-foreground">{achievement.description}</div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    {achievement.achieved ? (
                      <div className="flex items-center space-x-2 text-green-600">
                        <Trophy className="h-4 w-4" />
                        <span className="text-sm">달성: {achievement.date}</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>진행도</span>
                          <span>{achievement.progress}/{achievement.target || 100}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(achievement.progress / (achievement.target || 100) * 100, 100)}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {/* 업적 상세 Drawer */}
              <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                <DrawerContent>
                  {selectedAchievement && (
                    <div className="p-0 flex flex-col items-center justify-center w-full">
                      <div className="mx-auto w-full max-w-sm bg-white rounded-xl shadow-lg p-8 flex flex-col items-center justify-center">
                        <DrawerTitle>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${getBadgeColor(selectedAchievement.badge)} text-xs px-2 py-0.5`}>{selectedAchievement.badge}</Badge>
                            <span className="font-bold text-lg">{selectedAchievement.title}</span>
                          </div>
                        </DrawerTitle>
                        <DrawerDescription>
                          {selectedAchievement.description}
                        </DrawerDescription>
                        {/* 진행 바를 항상 중앙에 표시 */}
                        <div className="w-full my-6">
                          <div className="flex justify-between text-sm mb-1">
                            <span>진행도</span>
                            <span>{selectedAchievement.progress}/{selectedAchievement.target || 100}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${Math.min(selectedAchievement.progress / (selectedAchievement.target || 100) * 100, 100)}%` }} />
                          </div>
                        </div>
                        {selectedAchievement.achieved ? (
                          <div className="flex items-center space-x-2 text-green-600 mb-2">
                            <Trophy className="h-4 w-4" />
                            <span className="text-sm">달성: {selectedAchievement.date}</span>
                          </div>
                        ) : null}
                        <button className="mt-4 px-6 py-2 bg-primary text-white rounded hover:bg-primary/90 text-base font-medium" style={{minWidth:'120px'}} onClick={() => setDrawerOpen(false)}>닫기</button>
                      </div>
                    </div>
                  )}
                </DrawerContent>
              </Drawer>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Ranking;
