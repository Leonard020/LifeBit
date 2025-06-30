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
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Layout } from "../components/Layout";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  exerciseCatalogId: number;
  name: string;
  bodyPart: string;
  exerciseType: string | null;
  intensity: string;
  createdAt: string;
}

interface EditingCatalog {
  exerciseCatalogId: number;
  name: string;
  bodyPart: string;
  exerciseType: string;
  intensity: string;
}

export const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>(null);
  const usersPerPage = 10;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'catalog' | 'users'>('catalog');
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
  const [catalogCurrentPage, setCatalogCurrentPage] = useState(1);
  const [userCurrentPage, setUserCurrentPage] = useState(1);

  // 운동 카탈로그 수정 모달 관련 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<EditingCatalog | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // 운동 카탈로그 삭제 관련 상태
  const [deleteCatalogId, setDeleteCatalogId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // 필터링 상태
  const [showUnsetIntensityOnly, setShowUnsetIntensityOnly] = useState(false);

  // 영어 → 한글 변환 함수들
  const convertBodyPartToKorean = (english: string): string => {
    const mapping: Record<string, string> = {
      'chest': '가슴',
      'back': '등', 
      'legs': '다리',
      'shoulders': '어깨',
      'arms': '팔',
      'abs': '복근',
      'cardio': '유산소'
    };
    return mapping[english.toLowerCase()] || english;
  };

  const convertExerciseTypeToKorean = (english: string): string => {
    const mapping: Record<string, string> = {
      'strength': '근력',
      'aerobic': '유산소', 
    };
    return mapping[english.toLowerCase()] || english;
  };

  const convertIntensityToKorean = (english: string): string => {
    const mapping: Record<string, string> = {
      'low': '하',
      'medium': '중',
      'high': '상'
    };
    return mapping[english.toLowerCase()] || english;
  };

  // 한글 → 영어 변환 함수들 (API 요청용)
  const convertBodyPartToEnglish = (korean: string): string => {
    const mapping: Record<string, string> = {
      '가슴': 'chest',
      '등': 'back', 
      '다리': 'legs',
      '어깨': 'shoulders',
      '팔': 'arms',
      '복근': 'abs',
      '유산소': 'cardio'
    };
    return mapping[korean] || korean.toLowerCase();
  };

  const convertExerciseTypeToEnglish = (korean: string): string => {
    const mapping: Record<string, string> = {
      '근력': 'strength',
      '유산소': 'aerobic',
    };
    return mapping[korean] || korean.toLowerCase();
  };

  const convertIntensityToEnglish = (korean: string): string => {
    const mapping: Record<string, string> = {
      '하': 'low',
      '중': 'medium',
      '상': 'high'
    };
    return mapping[korean] || korean.toLowerCase();
  };

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
        const res = await fetch('http://localhost:8080/api/exercises/admin/catalog', {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch catalogs');
        const data = await res.json();
        console.log('🏋️ [AdminPage] 운동 카탈로그 API 응답:', data);
        setCatalogs(data);
      } catch (err) {
        console.error('❌ [AdminPage] 운동 카탈로그 로딩 실패:', err);
        toast({ title: "오류", description: "운동 카탈로그 로딩 실패", variant: "destructive" });
      }
    };
    if (activeTab === 'catalog') {
      fetchCatalogs();
      setCatalogCurrentPage(1);
    } else {
      setUserCurrentPage(1);
    }
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

  // 운동 카탈로그 수정 모달 열기
  const handleEdit = (catalog: CatalogItem) => {
    setEditingCatalog({
      exerciseCatalogId: catalog.exerciseCatalogId,
      name: catalog.name,
      bodyPart: convertBodyPartToKorean(catalog.bodyPart),
      exerciseType: convertExerciseTypeToKorean(catalog.exerciseType || 'strength'),
      intensity: catalog.intensity ? convertIntensityToKorean(catalog.intensity) : ''
    });
    setShowEditModal(true);
  };

  // 운동 카탈로그 삭제 함수
  const handleDeleteCatalog = async (catalogId: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/exercises/admin/catalog/${catalogId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!res.ok) {
        throw new Error(`삭제 실패: ${res.status}`);
      }

      // 목록에서 삭제된 항목 제거
      setCatalogs(prev => prev.filter(catalog => catalog.exerciseCatalogId !== catalogId));
      
      toast({ 
        title: '삭제 완료', 
        description: '운동 카탈로그가 삭제되었습니다.' 
      });
      
    } catch (error) {
      console.error('❌ [AdminPage] 운동 카탈로그 삭제 실패:', error);
      toast({ 
        title: '삭제 실패', 
        description: '운동 카탈로그 삭제에 실패했습니다.', 
        variant: 'destructive' 
      });
    } finally {
      setShowDeleteDialog(false);
      setDeleteCatalogId(null);
    }
  };

  // 운동 카탈로그 수정 처리
  const handleUpdateCatalog = async () => {
    if (!editingCatalog) return;
    
    setIsUpdating(true);
    try {
      // 변환 과정 디버깅
      const requestData = {
        name: editingCatalog.name,
        bodyPart: convertBodyPartToEnglish(editingCatalog.bodyPart),
        exerciseType: convertExerciseTypeToEnglish(editingCatalog.exerciseType),
        intensity: editingCatalog.intensity ? convertIntensityToEnglish(editingCatalog.intensity) : null
      };
      
      console.log('🔧 [수정 요청] 원본 데이터:', editingCatalog);
      console.log('🔧 [수정 요청] 변환된 데이터:', requestData);
      
      const res = await fetch(`http://localhost:8080/api/exercises/admin/catalog/${editingCatalog.exerciseCatalogId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(requestData)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ [수정 실패] 응답:', errorText);
        throw new Error(`수정 실패: ${res.status} - ${errorText}`);
      }
      
      const updatedCatalog = await res.json();
      console.log('✅ [수정 성공] 응답 데이터:', updatedCatalog);
      console.log('✅ [수정 성공] bodyPart 필드:', updatedCatalog.bodyPart);
      console.log('✅ [수정 성공] 전체 필드:', Object.keys(updatedCatalog));
      
      // 목록을 다시 불러와서 최신 데이터 반영
      const refreshRes = await fetch('http://localhost:8080/api/exercises/admin/catalog', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (refreshRes.ok) {
        const refreshedData = await refreshRes.json();
        setCatalogs(refreshedData);
        console.log('🔄 [목록 새로고침] 완료');
      }
      
      toast({ title: '수정 완료', description: '운동 카탈로그가 수정되었습니다.' });
      setShowEditModal(false);
      setEditingCatalog(null);
    } catch (error) {
      console.error('❌ [AdminPage] 운동 카탈로그 수정 실패:', error);
      toast({ 
        title: '수정 실패', 
        description: error instanceof Error ? error.message : '운동 카탈로그 수정에 실패했습니다.', 
        variant: 'destructive' 
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // 필터링된 카탈로그 목록
  const filteredCatalogs = showUnsetIntensityOnly 
    ? catalogs.filter(catalog => !catalog.intensity || catalog.intensity === null)
    : catalogs;
  
  const totalItems = activeTab === 'users' ? users.length : filteredCatalogs.length;
  const totalPages = Math.ceil(totalItems / usersPerPage);
  const currentPage = activeTab === 'users' ? userCurrentPage : catalogCurrentPage;
  const setCurrentPage = activeTab === 'users' ? setUserCurrentPage : setCatalogCurrentPage;
  
  const indexOfLast = currentPage * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;
  const currentList = activeTab === 'users'
    ? users.slice(indexOfFirst, indexOfLast)
    : filteredCatalogs.slice(indexOfFirst, indexOfLast);

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));

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
            <CardTitle>
              <div className="flex justify-between items-center">
                <span>{activeTab === 'catalog' ? '운동 카탈로그 관리' : '회원 관리'}</span>
                {activeTab === 'catalog' && (
                  <Button 
                    variant={showUnsetIntensityOnly ? 'default' : 'outline'} 
                    size="sm"
                    onClick={() => setShowUnsetIntensityOnly(!showUnsetIntensityOnly)}
                  >
                    {showUnsetIntensityOnly ? '전체 보기' : '미설정 운동만 보기'}
                  </Button>
                )}
              </div>
            </CardTitle>
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
                {currentList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      {activeTab === 'catalog' && showUnsetIntensityOnly 
                        ? '미설정 운동이 없습니다.' 
                        : activeTab === 'catalog' 
                          ? '등록된 운동이 없습니다.'
                          : '등록된 사용자가 없습니다.'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  currentList.map((item: any) => (
                    <TableRow key={`${activeTab}-${activeTab === 'users' ? item.id : item.exerciseCatalogId}`}>
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
                          <TableCell>{convertBodyPartToKorean(item.bodyPart)}</TableCell>
                          <TableCell>{convertExerciseTypeToKorean(item.exerciseType || 'strength')}</TableCell>
                          <TableCell>
                            {item.intensity ? convertIntensityToKorean(item.intensity) : '미설정'}
                          </TableCell>
                          <TableCell>
                            {item.createdAt ? 
                              new Date(item.createdAt).toLocaleString('ko-KR', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : '-'
                            }
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(item)}>수정</Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => { 
                                  setDeleteCatalogId(item.exerciseCatalogId); 
                                  setShowDeleteDialog(true); 
                                }}
                              >
                                삭제
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  ))
                )}
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
                    <Button key={page} variant={currentPage === page ? 'default' : 'outline'} size="sm" onClick={() => setCurrentPage(page)}>{page}</Button>
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
            <DialogDescription>정말로 이 사용자를 삭제하시겠습니까?</DialogDescription>
            <DialogFooter>
              <Button variant="destructive" onClick={() => handleDelete(deleteUserId!)}>삭제</Button>
              <Button variant="outline" onClick={() => setShowDialog(false)}>취소</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 운동 카탈로그 삭제 확인 다이얼로그 */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>운동 카탈로그 삭제 확인</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              정말로 이 운동을 카탈로그에서 삭제하시겠습니까? 
              이 작업은 되돌릴 수 없으며, 기존 운동 기록에는 영향을 주지 않습니다.
            </DialogDescription>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>취소</Button>
              <Button variant="destructive" onClick={() => handleDeleteCatalog(deleteCatalogId!)}>삭제</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 운동 카탈로그 수정 모달 */}
        <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>운동 카탈로그 수정</DialogTitle>
              <DialogDescription>운동의 정보를 수정할 수 있습니다.</DialogDescription>
            </DialogHeader>
            {editingCatalog && (
              <div className="grid gap-4 py-4">
                {/* 운동명 */}
                <div className="grid gap-2">
                  <Label htmlFor="name">운동명</Label>
                  <Input
                    id="name"
                    value={editingCatalog.name}
                    onChange={(e) => setEditingCatalog(prev => 
                      prev ? { ...prev, name: e.target.value } : null
                    )}
                    placeholder="운동명을 입력하세요"
                  />
                </div>

                {/* 운동 부위 */}
                <div className="grid gap-2">
                  <Label htmlFor="bodyPart">운동 부위</Label>
                  <Select 
                    value={editingCatalog.bodyPart} 
                    onValueChange={(value) => setEditingCatalog(prev => 
                      prev ? { ...prev, bodyPart: value } : null
                    )}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="운동 부위 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="가슴">가슴</SelectItem>
                      <SelectItem value="등">등</SelectItem>
                      <SelectItem value="다리">다리</SelectItem>
                      <SelectItem value="어깨">어깨</SelectItem>
                      <SelectItem value="팔">팔</SelectItem>
                      <SelectItem value="복근">복근</SelectItem>
                      <SelectItem value="유산소">유산소</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 운동 타입 */}
                <div className="grid gap-2">
                  <Label htmlFor="exerciseType">운동 타입</Label>
                  <Select 
                    value={editingCatalog.exerciseType} 
                    onValueChange={(value) => setEditingCatalog(prev => 
                      prev ? { ...prev, exerciseType: value } : null
                    )}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="운동 타입 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="근력">근력</SelectItem>
                      <SelectItem value="유산소">유산소</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 강도 */}
                <div className="grid gap-2">
                  <Label htmlFor="intensity">강도</Label>
                  <Select 
                    value={editingCatalog.intensity} 
                    onValueChange={(value) => setEditingCatalog(prev => 
                      prev ? { ...prev, intensity: value } : null
                    )}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="강도를 선택하세요" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="하">하</SelectItem>
                      <SelectItem value="중">중</SelectItem>
                      <SelectItem value="상">상</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditModal(false);
                  setEditingCatalog(null);
                }}
                disabled={isUpdating}
              >
                취소
              </Button>
              <Button 
                onClick={handleUpdateCatalog}
                disabled={isUpdating || !editingCatalog?.name.trim()}
              >
                {isUpdating ? '수정 중...' : '수정 완료'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
