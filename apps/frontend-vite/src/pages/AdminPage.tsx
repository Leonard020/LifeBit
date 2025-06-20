import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { isLoggedIn, getUserInfo, getToken } from '@/utils/auth';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Brain } from 'lucide-react';
import { Layout } from "../components/Layout";
import { AISystemRoadmap } from "../components/admin/AISystemRoadmap";

interface User {
  id: string;
  password: string;
  email: string;
  nickname: string;
  role: string;
  createdAt?: string;
  lastVisited?: string;
}

export const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminAccess = async () => {
      if (!isLoggedIn()) {
        toast({
          title: "접근 거부",
          description: "로그인이 필요합니다.",
          variant: "destructive",
        });
        navigate('/login');
        return;
      }

      const userInfo = getUserInfo();
      if (userInfo?.role !== 'ADMIN') {
        toast({
          title: "접근 거부",
          description: "관리자 권한이 필요합니다.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      try {
        const response = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${getToken()}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast({
          title: "오류",
          description: "사용자 정보를 불러오는데 실패했습니다.",
          variant: "destructive",
        });
      }
    };

    checkAdminAccess();
  }, [navigate, toast]);

  const handleDelete = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
        },
      });
      if (!response.ok) throw new Error('Failed to delete user');
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast({ title: '삭제 성공', description: '사용자가 삭제되었습니다.' });
    } catch (error) {
      toast({ title: '오류', description: '사용자 삭제에 실패했습니다.', variant: 'destructive' });
    } finally {
      setShowDialog(false);
      setDeleteUserId(null);
    }
  };

  // Always keep admin on top, and sort non-admins by lastVisited desc by default
  const adminUsers = users.filter(u => u.role === 'ADMIN');
  const nonAdminUsers = users.filter(u => u.role !== 'ADMIN');
  let sortedUsers: User[];
  if (sortConfig) {
    sortedUsers = [...nonAdminUsers];
    sortedUsers.sort((a, b) => {
      const { key, direction } = sortConfig;
      // For date fields, compare as numbers
      if (key === 'createdAt' || key === 'lastVisited') {
        const aTime = a[key] ? new Date(a[key] as string).getTime() : 0;
        const bTime = b[key] ? new Date(b[key] as string).getTime() : 0;
        if (aTime < bTime) return direction === 'asc' ? -1 : 1;
        if (aTime > bTime) return direction === 'asc' ? 1 : -1;
        return 0;
      }
      // For string fields
      const aValue = a[key] ?? '';
      const bValue = b[key] ?? '';
      if (aValue < bValue) return direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  } else {
    sortedUsers = [...nonAdminUsers].sort((a, b) => {
      const aTime = a.lastVisited ? new Date(a.lastVisited).getTime() : 0;
      const bTime = b.lastVisited ? new Date(b.lastVisited).getTime() : 0;
      if (aTime === 0 && bTime === 0) return 0;
      if (aTime === 0) return 1;
      if (bTime === 0) return -1;
      return bTime - aTime;
    });
  }
  const finalUsers = [...adminUsers, ...sortedUsers];

  const handleSort = (key: keyof User) => {
    setSortConfig((prev) => {
      if (prev && prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">관리자 페이지</h1>
          <p className="text-gray-600 mt-1">사용자 관리 및 시스템 구축 현황을 확인하세요</p>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              사용자 관리
            </TabsTrigger>
            <TabsTrigger value="ai-roadmap" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI 시스템 로드맵
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>사용자 관리</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
              <TableHeader>
                <TableRow>
                  <TableHead onClick={() => handleSort('email')} style={{ cursor: 'pointer' }}>
                    사용자 ID{sortConfig?.key === 'email' ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                  </TableHead>
                  <TableHead onClick={() => handleSort('nickname')} style={{ cursor: 'pointer' }}>
                    닉네임{sortConfig?.key === 'nickname' ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                  </TableHead>
                  {/* <TableHead>비밀번호</TableHead> */}
                  <TableHead onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
                    생성 날짜{sortConfig?.key === 'createdAt' ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                  </TableHead>
                  <TableHead onClick={() => handleSort('lastVisited')} style={{ cursor: 'pointer' }}>
                    마지막 접속 일시{sortConfig?.key === 'lastVisited' ? (sortConfig.direction === 'asc' ? ' ▲' : ' ▼') : ''}
                  </TableHead>
                  <TableHead>권한</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finalUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.nickname}</TableCell>
                    {/* <TableCell>{user.password}</TableCell> */}
                    <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                    <TableCell>{user.lastVisited ? new Date(user.lastVisited).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      {user.role === 'USER' && (
                        <Button variant="destructive" size="sm" onClick={() => { setDeleteUserId(user.id); setShowDialog(true); }}>
                          X
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
                </CardContent>
              </Card>

              <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>사용자 삭제 확인</DialogTitle>
                  </DialogHeader>
                  <div>정말로 이 사용자를 삭제하시겠습니까?</div>
                  <DialogFooter>
                    <Button variant="destructive" onClick={() => handleDelete(deleteUserId!)}>삭제</Button>
                    <Button variant="outline" onClick={() => setShowDialog(false)}>취소</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="ai-roadmap" className="mt-6">
              <AISystemRoadmap />
            </TabsContent>
          </Tabs>
        </div>
      </Layout>
    );
  }; 