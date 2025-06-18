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
import { Layout } from "../components/Layout";

interface User {
  id: string;
  password: string;
  email: string;
  nickname: string;
  role: string;
}

export const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
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

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>관리자 페이지</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>사용자 ID</TableHead>
                  <TableHead>이메일</TableHead>
                  <TableHead>닉네임</TableHead>
                  {/* <TableHead>비밀번호</TableHead> */}
                  <TableHead>권한</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.id}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.nickname}</TableCell>
                    {/* <TableCell>{user.password}</TableCell> */}
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
      </div>
    </Layout>
  );
}; 