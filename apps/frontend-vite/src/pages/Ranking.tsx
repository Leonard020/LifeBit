import React, { useState, useEffect, useRef } from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Trophy, Medal, Award, TrendingUp, Calendar, Target, Loader2, Check } from 'lucide-react';
import { getRanking, initializeAchievements, completeAchievement, getUserProfile } from '@/api/auth';
import { getToken, getUserInfo } from '@/utils/auth';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Drawer, DrawerContent, DrawerTrigger, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { getTierMeta } from '@/constants/rankingTierMeta';
import { Button } from '@/components/ui/button';
import { API_CONFIG } from '@/config/env';

interface RankingUser {
  rank: number;
  userId: number;
  nickname: string;
  score: number;
  badge: string;
  streakDays: number;
  tier: string;
  colorCode?: string;
  profileImageUrl?: string;
}

interface MyRanking {
  rank: number;
  score: number;
  streakDays: number;
  totalUsers: number;
  tier: string;
  colorCode?: string;
  userId?: number;
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
  const [initializing, setInitializing] = useState(false);
  const [completingAchievement, setCompletingAchievement] = useState<string | null>(null);
  const location = useLocation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [myProfileImageUrl, setMyProfileImageUrl] = useState<string | undefined>(undefined);

  // 업적 완료 상태 체크 헬퍼 함수
  const isAchievementCompleted = (achievement: Achievement) => {
    return achievement.progress >= (achievement.target || 100);
  };

  // 업적 상태에 따른 스타일 클래스 반환
  const getAchievementStatusClass = (achievement: Achievement) => {
    if (achievement.achieved) {
      return {
        container: 'border-green-200 bg-green-50 dark:bg-[#181c2b] dark:border-green-900',
        title: 'text-green-800 dark:text-green-300',
        description: 'text-green-600 dark:text-green-400'
      };
    } else if (isAchievementCompleted(achievement)) {
      return {
        container: 'border-yellow-200 bg-yellow-50 dark:bg-[#232946] dark:border-yellow-900',
        title: 'text-yellow-800 dark:text-yellow-200',
        description: 'text-yellow-600 dark:text-yellow-300'
      };
    } else {
      return {
        container: 'border-gray-200 bg-gray-50 dark:bg-[#232946] dark:border-gray-700',
        title: 'text-gray-700 dark:text-gray-200',
        description: 'text-gray-500 dark:text-gray-400'
      };
    }
  };

  // 업적 달성 처리 함수
  const handleCompleteAchievement = async (achievement: Achievement) => {
    // 이미 처리 중인 경우 중복 실행 방지
    if (completingAchievement === achievement.title) {
      return;
    }
    
    try {
      const userInfo = getUserInfo();
      console.log('Debug - UserInfo:', userInfo);
      console.log('Debug - Achievement:', achievement);
      
      if (!userInfo?.userId) {
        toast.error('사용자 정보를 찾을 수 없습니다.');
        return;
      }
      
      const userId = Number(userInfo.userId);
      console.log('Debug - Calling completeAchievement with:', { userId, achievementTitle: achievement.title });
      
      setCompletingAchievement(achievement.title);
      
      // API 호출
      await completeAchievement(userId, achievement.title);
      
      // 성공 처리
      toast.success('업적이 달성되었습니다!');
      
      // 즉시 로컬 상태 업데이트
      if (rankingData) {
        const updatedAchievements = rankingData.achievements.map(a => {
          if (a.title === achievement.title) {
            const today = new Date();
            const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            console.log('Debug - Updating achievement:', { title: a.title, date: formattedDate });
            return {
              ...a,
              achieved: true,
              date: formattedDate
            };
          }
          return a;
        });
        
        console.log('Debug - Updated achievements:', updatedAchievements);
        setRankingData({
          ...rankingData,
          achievements: updatedAchievements
        });
      }
      
      // Drawer 닫기 (상세 보기에서 클릭한 경우)
      if (selectedAchievement?.title === achievement.title) {
        setDrawerOpen(false);
      }
      
      // 백그라운드에서 데이터 새로고침 (캐시 무효화)
      setTimeout(async () => {
        try {
          await fetchRankingData();
        } catch (error) {
          console.log('Background refresh failed:', error);
        }
      }, 1000);
      
    } catch (error) {
      console.error('Failed to complete achievement:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      toast.error('업적 달성 처리에 실패했습니다.');
    } finally {
      setCompletingAchievement(null);
    }
  };

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
        
        // 업적 데이터 상세 로깅
        if (data.achievements) {
          console.log('Debug - Achievements data:', data.achievements);
          data.achievements.forEach((achievement: Achievement, index: number) => {
            console.log(`Debug - Achievement ${index}:`, {
              title: achievement.title,
              achieved: achievement.achieved,
              date: achievement.date,
              progress: achievement.progress,
              target: achievement.target
            });
          });
        }
        
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

  useEffect(() => {
    fetchRankingData();
  }, [navigate]);

  // 알림에서 전달받은 achievementId 처리
  useEffect(() => {
    const state = location.state as { achievementId?: number };
    if (state?.achievementId && rankingData) {
      // 업적 섹션으로 스크롤
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
          });
        }
      }, 500); // 데이터 로드 후 스크롤
    }
  }, [location.state, rankingData]);

  // 업적 초기화 함수
  const handleInitializeAchievements = async () => {
    try {
      setInitializing(true);
      await initializeAchievements();
      toast.success('업적이 초기화되었습니다!');
      // 데이터 다시 로드
      fetchRankingData();
    } catch (error) {
      toast.error('업적 초기화에 실패했습니다.');
    } finally {
      setInitializing(false);
    }
  };

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

  useEffect(() => {
    // Fetch current user's profile image for top ranker display
    getUserProfile().then(profile => {
      if (profile && profile.profileImageUrl) {
        setMyProfileImageUrl(profile.profileImageUrl);
      }
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Layout>
          <div className="container mx-auto px-4 py-8 pb-24">
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">랭킹 데이터를 불러오는 중...</span>
            </div>
          </div>
        </Layout>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
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
      </div>
    );
  }

  if (!rankingData) {
    return (
      <div className="min-h-screen bg-background">
        <Layout>
          <div className="container mx-auto px-4 py-8 pb-24">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-2">랭킹</h1>
              <p className="text-muted-foreground">랭킹 데이터가 없습니다.</p>
            </div>
          </div>
        </Layout>
      </div>
    );
  }

  const { topRankers, myRanking, achievements } = rankingData;

  // 데이터가 없을 때 안내 메시지 표시 - 사용자 ID가 있으면 데이터가 있는 것으로 간주
  const hasNoData = !myRanking?.userId && topRankers.length === 0 && achievements.length === 0;

  // 내 랭킹 등급 정보
  const myTierMeta = getTierMeta(String(myRanking.tier));

  return (
    <div className="min-h-screen bg-background">
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
              <div className="space-y-2 text-sm text-muted-foreground max-w-md mx-auto mb-8">
                <p>• 꾸준한 운동과 기록으로 점수를 획득하세요</p>
                <p>• 연속 기록 일수를 늘려 더 높은 순위에 도전하세요</p>
                <p>• 다양한 업적을 달성하여 배지를 수집하세요</p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => navigate('/profile')}
                  className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  프로필 작성하러 가기
                </button>
                <div>
                  <button
                    onClick={() => navigate('/')}
                    className="px-6 py-3 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors font-medium"
                  >
                    메뉴로 돌아가기
                  </button>
                </div>
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
                  {/* 등급명/색상 표시 + 툴클 */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="flex items-center justify-center gap-2 mb-2 tier-badge"
                        style={{
                          background: myTierMeta.color,
                          color: '#fff',
                          borderRadius: '8px',
                          padding: '6px 16px',
                          fontWeight: 'bold',
                          fontSize: '1.1rem',
                        }}
                      >
                        <Trophy className="mr-1 h-5 w-5" />
                        {myTierMeta.name} 등급
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      점수에 따라 자동으로 부여되는 공식 등급입니다.
                    </TooltipContent>
                  </Tooltip>
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
                  {topRankers.map((user: RankingUser) => {
                    const tierMeta = getTierMeta(String(user.tier));
                    const profileImageUrl = user.rank === 1 && myProfileImageUrl && user.userId === rankingData.myRanking.userId
                      ? myProfileImageUrl
                      : user.profileImageUrl;
                    return (
                      <div key={`${user.userId}-${user.rank}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 flex items-center justify-center">
                            {getRankIcon(user.rank)}
                          </div>
                          <Avatar>
                            {profileImageUrl && typeof profileImageUrl === 'string' && profileImageUrl.trim() !== '' ? (
                              <img
                                src={profileImageUrl.startsWith('http') ? profileImageUrl : `${API_CONFIG.BASE_URL}${profileImageUrl}`}
                                alt={user.nickname}
                                className="w-8 h-8 rounded-full object-cover"
                                onError={e => {
                                  // fallback to first letter if image fails to load
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<div class='w-8 h-8 gradient-bg rounded-full flex items-center justify-center'><span class='text-white text-sm font-bold'>${user.nickname.charAt(0)}</span></div>`;
                                  }
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                                <span className="text-white text-sm font-bold">
                                  {user.nickname.charAt(0)}
                                </span>
                              </div>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.nickname}</div>
                            <div className="flex items-center gap-2">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span
                                    className="flex items-center tier-badge"
                                    style={{
                                      background: tierMeta.color,
                                      color: '#fff',
                                      borderRadius: '8px',
                                      padding: '2px 8px',
                                      fontWeight: 'bold',
                                      fontSize: '0.9rem',
                                    }}
                                  >
                                    <Medal className="mr-1 h-4 w-4" />
                                    {tierMeta.name} 등급
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  점수에 따라 자동으로 부여되는 공식 등급입니다.
                                </TooltipContent>
                              </Tooltip>
                              <span className="text-xs text-muted-foreground">{tierMeta.desc}</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {user.streakDays}일 연속
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{user.score.toLocaleString()}점</div>
                          {/* Badge(뱃지)는 등급과 혼동 방지를 위해 숨김 또는 별도 표기 */}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievement Badges */}
          {!hasNoData && achievements.length > 0 && (
            <Card className="hover-lift" ref={scrollRef}>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5" />
                  나의 업적/뱃지
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {achievements.map((achievement: Achievement, index: number) => {
                    const statusClass = getAchievementStatusClass(achievement);
                    return (
                      <div key={achievement.title} className="relative">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                                  className={`p-4 rounded-lg border cursor-pointer hover:shadow-lg hover:border-primary transition ${statusClass.container}`}
                                  onClick={(e) => {
                                    // 버튼 클릭이 아닌 경우에만 Drawer 열기
                                    const target = e.target as HTMLElement;
                                    if (!target.closest('button')) {
                                      setSelectedAchievement(achievement);
                                      setDrawerOpen(true);
                                    }
                                  }}
                              tabIndex={0}
                              role="button"
                                  onKeyDown={e => { 
                                    if (e.key === 'Enter' || e.key === ' ') { 
                                      setSelectedAchievement(achievement); 
                                      setDrawerOpen(true); 
                                    } 
                                  }}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                      <h4 className={`font-medium ${statusClass.title}`}>{achievement.title}</h4>
                                      <p className={`text-sm ${statusClass.description}`}>{achievement.description}</p>
                                </div>
                                <span
                                  className="badge-outline border border-gray-400 text-gray-700 px-2 py-0.5 rounded-full flex items-center"
                                  style={{ fontWeight: 'bold', fontSize: '0.95rem' }}
                                >
                                  <Award className="mr-1 h-4 w-4" />
                                  {achievement.badge} 뱃지
                                </span>
                              </div>
                              {achievement.achieved ? (
                                <div className="flex items-center space-x-2 text-green-600">
                                  <Trophy className="h-4 w-4" />
                                      <span className="text-sm">
                                        달성: {achievement.date || '날짜 정보 없음'}
                                      </span>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span>진행도</span>
                                    <span>{achievement.progress}/{achievement.target || 100}</span>
                                  </div>
                                      <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                                        {isAchievementCompleted(achievement) ? (
                                          // 완료된 경우: 그라데이션 배경 + 체크 아이콘 (애니메이션 제거)
                                          <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500 flex items-center justify-end pr-1">
                                            <Check className="h-3 w-3 text-white" />
                                          </div>
                                        ) : (
                                          // 진행 중인 경우: 기본 진행바
                                          <div 
                                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                                            style={{ width: `${Math.min(achievement.progress / (achievement.target || 100) * 100, 100)}%` }} 
                                          />
                                        )}
                                      </div>
                                      {isAchievementCompleted(achievement) && !achievement.achieved && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setTimeout(() => handleCompleteAchievement(achievement), 0);
                                          }}
                                          onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                          }}
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                              e.preventDefault();
                                              e.stopPropagation();
                                              setTimeout(() => handleCompleteAchievement(achievement), 0);
                                            }
                                          }}
                                          disabled={completingAchievement === achievement.title}
                                          className="flex items-center justify-center text-sm text-green-600 font-medium animate-pulse mt-2 hover:text-green-700 hover:scale-105 transition-all duration-200 w-full py-2 rounded bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          {completingAchievement === achievement.title ? (
                                            <>
                                              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                              달성 처리 중...
                                            </>
                                          ) : (
                                            <>
                                              <Check className="h-3 w-3 mr-1" />
                                              목표 달성! (클릭하여 달성)
                                            </>
                                          )}
                                        </button>
                                      )}
                                </div>
                              )}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            특정 업적을 달성하면 획득할 수 있는 뱃지입니다.
                          </TooltipContent>
                        </Tooltip>
                          </div>
                        );
                      })}
                </div>
                {/* 업적 상세 Drawer */}
                <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                  <DrawerContent>
                    {selectedAchievement && (
                      <div className="p-0 flex flex-col items-center justify-center w-full">
                        <div className="mx-auto w-full max-w-sm bg-white rounded-xl shadow-lg p-8 flex flex-col items-center justify-center">
                          <DrawerTitle>
                            <div className="flex items-center gap-2 mb-2">
                              <span
                                className="badge-outline border border-gray-400 text-gray-700 px-2 py-0.5 rounded-full flex items-center"
                                style={{ fontWeight: 'bold', fontSize: '0.95rem' }}
                              >
                                <Award className="mr-1 h-4 w-4" />
                                {selectedAchievement.badge} 뱃지
                              </span>
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
                            <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                              {isAchievementCompleted(selectedAchievement) ? (
                                // 완료된 경우: 그라데이션 배경 + 체크 아이콘 (애니메이션 제거)
                                <div className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500 flex items-center justify-end pr-2">
                                  <Check className="h-4 w-4 text-white" />
                                </div>
                              ) : (
                                // 진행 중인 경우: 기본 진행바
                                <div 
                                  className="bg-primary h-3 rounded-full transition-all duration-300" 
                                  style={{ width: `${Math.min(selectedAchievement.progress / (selectedAchievement.target || 100) * 100, 100)}%` }} 
                                />
                              )}
                            </div>
                            {isAchievementCompleted(selectedAchievement) && !selectedAchievement.achieved && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setTimeout(() => handleCompleteAchievement(selectedAchievement), 0);
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setTimeout(() => handleCompleteAchievement(selectedAchievement), 0);
                                  }
                                }}
                                disabled={completingAchievement === selectedAchievement.title}
                                className="flex items-center justify-center text-sm text-green-600 font-medium animate-pulse mt-2 hover:text-green-700 hover:scale-105 transition-all duration-200 w-full py-2 rounded bg-green-50 hover:bg-green-100 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {completingAchievement === selectedAchievement.title ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    달성 처리 중...
                                  </>
                                ) : (
                                  <>
                                    <Check className="h-4 w-4 mr-1" />
                                    목표 달성! (클릭하여 달성)
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                          {selectedAchievement.achieved ? (
                            <div className="flex items-center space-x-2 text-green-600 mb-2">
                              <Trophy className="h-4 w-4" />
                              <span className="text-sm">
                                달성: {selectedAchievement.date || '날짜 정보 없음'}
                              </span>
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

          {/* 업적이 없을 때 초기화 버튼 */}
          {!hasNoData && achievements.length === 0 && (
            <Card className="hover-lift">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="mr-2 h-5 w-5" />
                  나의 업적/뱃지
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">🏆</div>
                  <h4 className="text-lg font-medium mb-2">업적이 초기화되지 않았습니다</h4>
                  <p className="text-muted-foreground mb-6">
                    업적을 초기화하여 다양한 뱃지를 수집해보세요!
                  </p>
                  <Button
                    onClick={handleInitializeAchievements}
                    disabled={initializing}
                    className="px-6 py-3"
                  >
                    {initializing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        초기화 중...
                      </>
                    ) : (
                      '업적 초기화하기'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Layout>
    </div>
  );
};

export default Ranking;
