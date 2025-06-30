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
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface User {
  id: string;
  password: string;
  email: string;
  nickname: string;
  role: string;
  createdAt?: string;
  lastVisited?: string;
}

interface CatalogItem {
  id: number;
  name: string;
  bodyPart: string;
  exerciseType: string | null;
  intensity: string;
  createdAt: string;
}

export const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const usersPerPage = 10;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'catalog' | 'users'>('users');
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);

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
        const res = await fetch('/api/admin/users', {
          headers: { 'Authorization': `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        const data = await res.json();
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

  useEffect(() => {
    const fetchCatalogs = async () => {
      try {
        const res = await fetch('/api/exercises/catalog', {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch catalogs');
        const data = await res.json();
        setCatalogs(data);
      } catch (err) {
        toast({ title: "오류", description: "운동 카탈로그 로딩 실패", variant: "destructive" });
      }
    };
    if (activeTab === 'catalog') fetchCatalogs();
  }, [activeTab, toast]);

  const handleDelete = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({ title: '삭제 성공', description: '사용자가 삭제되었습니다.' });
    } catch {
      toast({ title: '오류', description: '사용자 삭제 실패', variant: 'destructive' });
    } finally {
      setShowDialog(false);
      setDeleteUserId(null);
    }
  };

  const totalItems = activeTab === 'users' ? users.length : catalogs.length;
  const totalPages = Math.ceil(totalItems / usersPerPage);
  const indexOfLast = currentPage * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;
  const currentList = activeTab === 'users'
    ? users.slice(indexOfFirst, indexOfLast)
    : catalogs.slice(indexOfFirst, indexOfLast);

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const goToPage = (page: number) => setCurrentPage(page);

  const getPageNumbers = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (currentPage <= 3) return [1, 2, 3, 4, 5];
    if (currentPage > totalPages - 3) return [
      totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages
    ];
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
  };

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <div className="flex gap-4 mb-6">
          <Button variant={activeTab === 'catalog' ? 'default' : 'outline'} onClick={() => setActiveTab('catalog')}>운동 카탈로그</Button>
          <Button variant={activeTab === 'users' ? 'default' : 'outline'} onClick={() => setActiveTab('users')}>회원 관리</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{activeTab === 'catalog' ? '운동 카탈로그 관리' : '회원 관리'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  {activeTab === 'users' ? (
                    <>
                      <TableHead>이메일</TableHead>
                      <TableHead>닉네임</TableHead>
                      <TableHead>가입일</TableHead>
                      <TableHead>마지막 접속</TableHead>
                      <TableHead>권한</TableHead>
                      <TableHead></TableHead>
                    </>
                  ) : (
                    <>
                      <TableHead>운동명</TableHead>
                      <TableHead>운동 부위</TableHead>
                      <TableHead>운동 타입</TableHead>
                      <TableHead>강도</TableHead>
                      <TableHead>생성일</TableHead>
                      <TableHead></TableHead>
                    </>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentList.map((item: any) => (
                  <TableRow key={item.id}>
                    {activeTab === 'users' ? (
                      <>
                        <TableCell>{item.email}</TableCell>
                        <TableCell>{item.nickname}</TableCell>
                        <TableCell>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('ko-KR') : '-'}</TableCell>
                        <TableCell>{item.lastVisited ? new Date(item.lastVisited).toLocaleDateString('ko-KR') : '-'}</TableCell>
                        <TableCell>{item.role}</TableCell>
                        <TableCell>
                          {item.role === 'USER' && (
                            <Button variant="destructive" size="sm" onClick={() => { setDeleteUserId(item.id); setShowDialog(true); }}>삭제</Button>
                          )}
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.bodyPart}</TableCell>
                        <TableCell>{item.exerciseType || '-'}</TableCell>
                        <TableCell>{item.intensity}</TableCell>
                        <TableCell>{new Date(item.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                        <TableCell><Button size="sm">수정</Button></TableCell>
                      </>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  {indexOfFirst + 1}-{Math.min(indexOfLast, totalItems)} of {totalItems} {activeTab === 'users' ? 'users' : 'exercises'}
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={goToFirstPage} disabled={currentPage === 1}><ChevronsLeft className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                  {getPageNumbers().map((page) => (
                    <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" onClick={() => goToPage(page)}>{page}</Button>
                  ))}
                  <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
                  <Button variant="outline" size="sm" onClick={goToLastPage} disabled={currentPage === totalPages}><ChevronsRight className="h-4 w-4" /></Button>
                </div>
              </div>
            )}
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
