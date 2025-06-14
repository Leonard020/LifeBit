
import React from 'react';
import { Layout } from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Trophy, Medal, Award, TrendingUp, Calendar, Target } from 'lucide-react';

const Ranking = () => {
  const myRanking = {
    rank: 24,
    score: 1847,
    streakDays: 12,
    totalUsers: 2841
  };

  const topRankers = [
    { rank: 1, name: '헬스킹', score: 3420, badge: 'platinum', streakDays: 45 },
    { rank: 2, name: '운동러버', score: 3180, badge: 'gold', streakDays: 38 },
    { rank: 3, name: '건강이최고', score: 2950, badge: 'gold', streakDays: 32 },
    { rank: 4, name: '바디빌더', score: 2780, badge: 'silver', streakDays: 28 },
    { rank: 5, name: '피트니스맨', score: 2650, badge: 'silver', streakDays: 25 },
  ];

  const achievements = [
    { 
      title: '7일 연속 기록', 
      description: '일주일 동안 꾸준히 기록했습니다', 
      badge: 'bronze',
      achieved: true,
      date: '2024-06-05'
    },
    { 
      title: '30일 연속 기록', 
      description: '한 달 동안 꾸준히 기록했습니다', 
      badge: 'silver',
      achieved: false,
      progress: 12 
    },
    { 
      title: '100일 연속 기록', 
      description: '100일 동안 꾸준히 기록했습니다', 
      badge: 'gold',
      achieved: false,
      progress: 12 
    },
    { 
      title: '1년 연속 기록', 
      description: '1년 동안 꾸준히 기록했습니다', 
      badge: 'platinum',
      achieved: false,
      progress: 12 
    },
  ];

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

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 pb-24">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">랭킹</h1>
          <p className="text-muted-foreground">사용자들과 함께 건강한 경쟁을 즐겨보세요</p>
        </div>

        {/* My Ranking */}
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
                  <div className="text-3xl font-bold gradient-text">{myRanking.rank}</div>
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
              <p className="text-sm text-muted-foreground">
                전체 {myRanking.totalUsers.toLocaleString()}명 중 {myRanking.rank}위
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Top Rankers */}
        <Card className="mb-8 hover-lift">
          <CardHeader>
            <CardTitle>상위 랭킹</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topRankers.map((user) => (
                <div key={user.rank} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 flex items-center justify-center">
                      {getRankIcon(user.rank)}
                    </div>
                    <Avatar>
                      <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name}</div>
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

        {/* Achievement Badges */}
        <Card className="hover-lift">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="mr-2 h-5 w-5" />
              활동 뱃지
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  achievement.achieved 
                    ? 'border-green-200 bg-green-50' 
                    : 'border-gray-200 bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className={`font-medium ${achievement.achieved ? 'text-green-800' : 'text-gray-700'}`}>
                        {achievement.title}
                      </h4>
                      <p className={`text-sm ${achievement.achieved ? 'text-green-600' : 'text-gray-500'}`}>
                        {achievement.description}
                      </p>
                    </div>
                    <Badge className={`${getBadgeColor(achievement.badge)} ml-2`}>
                      {achievement.badge}
                    </Badge>
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
                        <span>{achievement.progress}/100</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${achievement.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Ranking;
