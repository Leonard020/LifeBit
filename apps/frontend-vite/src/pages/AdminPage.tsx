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

interface FoodCatalogItem {
  foodItemId: number;
  name: string;
  servingSize: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  createdAt: string;
}

interface EditingCatalog {
  exerciseCatalogId: number;
  name: string;
  bodyPart: string;
  exerciseType: string;
  intensity: string;
}

interface EditingFoodCatalog {
  foodItemId: number;
  name: string;
  servingSize: number;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

export const AdminPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' } | null>(null);
  const usersPerPage = 10;
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'catalog' | 'food' | 'users'>('catalog');
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
  const [foodCatalogs, setFoodCatalogs] = useState<FoodCatalogItem[]>([]);
  const [catalogCurrentPage, setCatalogCurrentPage] = useState(1);
  const [foodCurrentPage, setFoodCurrentPage] = useState(1);
  const [userCurrentPage, setUserCurrentPage] = useState(1);

  // 운동 카탈로그 수정 모달 관련 상태
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<EditingCatalog | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // 운동 카탈로그 삭제 관련 상태
  const [deleteCatalogId, setDeleteCatalogId] = useState<number | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // 음식 카탈로그 수정 모달 관련 상태
  const [showEditFoodModal, setShowEditFoodModal] = useState(false);
  const [editingFoodCatalog, setEditingFoodCatalog] = useState<EditingFoodCatalog | null>(null);
  const [isUpdatingFood, setIsUpdatingFood] = useState(false);
  
  // 음식 카탈로그 삭제 관련 상태
  const [deleteFoodCatalogId, setDeleteFoodCatalogId] = useState<number | null>(null);
  const [showDeleteFoodDialog, setShowDeleteFoodDialog] = useState(false);
  
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

    const fetchFoodCatalogs = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/diet/admin/food-catalog', {
          headers: {
            'Authorization': `Bearer ${getToken()}`
          }
        });
        if (!res.ok) throw new Error('Failed to fetch food catalogs');
        const data = await res.json();
        console.log('🍽️ [AdminPage] 음식 카탈로그 API 응답:', data);
        setFoodCatalogs(data);
      } catch (err) {
        console.error('❌ [AdminPage] 음식 카탈로그 로딩 실패:', err);
        toast({ title: "오류", description: "음식 카탈로그 로딩 실패", variant: "destructive" });
      }
    };

    if (activeTab === 'catalog') {
      fetchCatalogs();
      setCatalogCurrentPage(1);
    } else if (activeTab === 'food') {
      fetchFoodCatalogs();
      setFoodCurrentPage(1);
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

  // 음식 카탈로그 수정 모달 열기
  const handleEditFood = (food: FoodCatalogItem) => {
    setEditingFoodCatalog({
      foodItemId: food.foodItemId,
      name: food.name,
      servingSize: food.servingSize,
      calories: food.calories,
      carbs: food.carbs,
      protein: food.protein,
      fat: food.fat
    });
    setShowEditFoodModal(true);
  };

  // 음식 카탈로그 수정 처리
  const handleUpdateFoodCatalog = async () => {
    if (!editingFoodCatalog) return;
    
    setIsUpdatingFood(true);
    try {
      const requestData = {
        name: editingFoodCatalog.name,
        serving_size: editingFoodCatalog.servingSize,
        calories: editingFoodCatalog.calories,
        carbs: editingFoodCatalog.carbs,
        protein: editingFoodCatalog.protein,
        fat: editingFoodCatalog.fat
      };
      
      console.log('🔧 [음식 수정 요청] 데이터:', requestData);
      
      const res = await fetch(`http://localhost:8080/api/diet/admin/food-catalog/${editingFoodCatalog.foodItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`
        },
        body: JSON.stringify(requestData)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ [음식 수정 실패] 응답:', errorText);
        throw new Error(`수정 실패: ${res.status} - ${errorText}`);
      }
      
      const updatedFood = await res.json();
      console.log('✅ [음식 수정 성공] 응답 데이터:', updatedFood);
      
      // 목록을 다시 불러와서 최신 데이터 반영
      const refreshRes = await fetch('http://localhost:8080/api/diet/admin/food-catalog', {
        headers: { 'Authorization': `Bearer ${getToken()}` }
      });
      if (refreshRes.ok) {
        const refreshedData = await refreshRes.json();
        setFoodCatalogs(refreshedData);
        console.log('🔄 [음식 목록 새로고침] 완료');
      }
      
      toast({ title: '수정 완료', description: '음식 카탈로그가 수정되었습니다.' });
      setShowEditFoodModal(false);
      setEditingFoodCatalog(null);
    } catch (error) {
      console.error('❌ [AdminPage] 음식 카탈로그 수정 실패:', error);
      toast({ 
        title: '수정 실패', 
        description: error instanceof Error ? error.message : '음식 카탈로그 수정에 실패했습니다.', 
        variant: 'destructive' 
      });
    } finally {
      setIsUpdatingFood(false);
    }
  };

  // 음식 카탈로그 삭제 함수
  const handleDeleteFoodCatalog = async (foodId: number) => {
    try {
      const res = await fetch(`http://localhost:8080/api/diet/admin/food-catalog/${foodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });

      if (!res.ok) {
        throw new Error(`삭제 실패: ${res.status}`);
      }

      // 목록에서 삭제된 항목 제거
      setFoodCatalogs(prev => prev.filter(food => food.foodItemId !== foodId));
      
      toast({ 
        title: '삭제 완료', 
        description: '음식 카탈로그가 삭제되었습니다.' 
      });
      
    } catch (error) {
      console.error('❌ [AdminPage] 음식 카탈로그 삭제 실패:', error);
      toast({ 
        title: '삭제 실패', 
        description: '음식 카탈로그 삭제에 실패했습니다.', 
        variant: 'destructive' 
      });
    } finally {
      setShowDeleteFoodDialog(false);
      setDeleteFoodCatalogId(null);
    }
  };

  // 필터링된 카탈로그 목록
  const filteredCatalogs = showUnsetIntensityOnly 
    ? catalogs.filter(catalog => !catalog.intensity || catalog.intensity === null)
    : catalogs;
  
  const totalItems = activeTab === 'users' ? users.length : 
                     activeTab === 'food' ? foodCatalogs.length : 
                     filteredCatalogs.length;
  const totalPages = Math.ceil(totalItems / usersPerPage);
  const currentPage = activeTab === 'users' ? userCurrentPage : 
                      activeTab === 'food' ? foodCurrentPage : 
                      catalogCurrentPage;
  const setCurrentPage = activeTab === 'users' ? setUserCurrentPage : 
                         activeTab === 'food' ? setFoodCurrentPage : 
                         setCatalogCurrentPage;
  
  const indexOfLast = currentPage * usersPerPage;
  const indexOfFirst = indexOfLast - usersPerPage;
  let currentList: User[] | FoodCatalogItem[] | CatalogItem[] = [];
  if (activeTab === 'users') {
    currentList = users.slice(indexOfFirst, indexOfLast);
  } else if (activeTab === 'food') {
    currentList = foodCatalogs.slice(indexOfFirst, indexOfLast);
  } else {
    currentList = filteredCatalogs.slice(indexOfFirst, indexOfLast);
  }

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
      <div className="container mx-auto py-8 bg-white text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-300">
        <div className="flex gap-4 mb-6">
          <Button variant={activeTab === 'catalog' ? 'default' : 'outline'} onClick={() => setActiveTab('catalog')}>운동 카탈로그</Button>
          <Button variant={activeTab === 'food' ? 'default' : 'outline'} onClick={() => setActiveTab('food')}>음식 카탈로그</Button>
          <Button variant={activeTab === 'users' ? 'default' : 'outline'} onClick={() => setActiveTab('users')}>회원 관리</Button>
        </div>

        <Card className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white transition-colors duration-300">
          <CardHeader>
            <CardTitle>
              <div className="flex justify-between items-center">
                <span>
                  {activeTab === 'catalog' ? '운동 카탈로그 관리' : 
                   activeTab === 'food' ? '음식 카탈로그 관리' : 
                   '회원 관리'}
                </span>
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
            <Table className="bg-white dark:bg-gray-900">
              <TableHeader>
                <TableRow className="bg-gray-100 dark:bg-gray-800">
                  {activeTab === 'users' ? (
                    <>
                      <TableHead>이메일</TableHead>
                      <TableHead>닉네임</TableHead>
                      <TableHead>가입일</TableHead>
                      <TableHead>마지막 접속</TableHead>
                      <TableHead>권한</TableHead>
                      <TableHead></TableHead>
                    </>
                  ) : activeTab === 'food' ? (
                    <>
                      <TableHead>음식명</TableHead>
                      <TableHead>기준량(g)</TableHead>
                      <TableHead>칼로리(kcal)</TableHead>
                      <TableHead>탄수화물(g)</TableHead>
                      <TableHead>단백질(g)</TableHead>
                      <TableHead>지방(g)</TableHead>
                      <TableHead>생성일</TableHead>
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
                  <TableRow className="bg-white dark:bg-gray-900">
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900">
                      {activeTab === 'catalog' && showUnsetIntensityOnly 
                        ? '미설정 운동이 없습니다.' 
                        : activeTab === 'catalog' 
                          ? '등록된 운동이 없습니다.'
                          : activeTab === 'food'
                            ? '등록된 음식이 없습니다.'
                            : '등록된 사용자가 없습니다.'
                      }
                    </TableCell>
                  </TableRow>
                ) : (
                  (currentList as (User[] | FoodCatalogItem[] | CatalogItem[])).map((item, idx) => (
                    <TableRow key={`${activeTab === 'users' ? (item as User).id : activeTab === 'food' ? (item as FoodCatalogItem).foodItemId : (item as CatalogItem).exerciseCatalogId}`} className="bg-white dark:bg-gray-900">
                      {activeTab === 'users' ? (
                        <>
                          <TableCell className="text-gray-900 dark:text-white">{(item as User).email}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{(item as User).nickname}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{(item as User).createdAt ? new Date((item as User).createdAt!).toLocaleDateString('ko-KR') : '-'}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{(item as User).lastVisited ? new Date((item as User).lastVisited!).toLocaleDateString('ko-KR') : '-'}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{(item as User).role}</TableCell>
                          <TableCell>
                            {(item as User).role === 'USER' && (
                              <Button variant="destructive" size="sm" onClick={() => { setDeleteUserId((item as User).id); setShowDialog(true); }}>삭제</Button>
                            )}
                          </TableCell>
                        </>
                      ) : activeTab === 'food' ? (
                        <>
                          <TableCell className="text-gray-900 dark:text-white">{(item as FoodCatalogItem).name}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{(item as FoodCatalogItem).servingSize}g</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{(item as FoodCatalogItem).calories.toFixed(1)}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{(item as FoodCatalogItem).carbs.toFixed(1)}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{(item as FoodCatalogItem).protein.toFixed(1)}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{(item as FoodCatalogItem).fat.toFixed(1)}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">
                            {(item as FoodCatalogItem).createdAt ? 
                              new Date((item as FoodCatalogItem).createdAt).toLocaleString('ko-KR', {
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
                              <Button variant="outline" size="sm" onClick={() => handleEditFood(item as FoodCatalogItem)}>수정</Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => { 
                                  setDeleteFoodCatalogId((item as FoodCatalogItem).foodItemId); 
                                  setShowDeleteFoodDialog(true); 
                                }}
                              >
                                삭제
                              </Button>
                            </div>
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell className="text-gray-900 dark:text-white">{(item as CatalogItem).name}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{convertBodyPartToKorean((item as CatalogItem).bodyPart)}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{convertExerciseTypeToKorean((item as CatalogItem).exerciseType || 'strength')}</TableCell>
                          <TableCell className="text-gray-900 dark:text-white">
                            {(item as CatalogItem).intensity ? convertIntensityToKorean((item as CatalogItem).intensity) : '미설정'}
                          </TableCell>
                          <TableCell className="text-gray-900 dark:text-white">{(item as CatalogItem).createdAt ? new Date((item as CatalogItem).createdAt).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleEdit(item as CatalogItem)}>수정</Button>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => { 
                                  setDeleteCatalogId((item as CatalogItem).exerciseCatalogId); 
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
                  {indexOfFirst + 1}-{Math.min(indexOfLast, totalItems)} of {totalItems} {activeTab === 'users' ? 'users' : activeTab === 'food' ? 'foods' : 'exercises'}
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

        {/* 음식 카탈로그 삭제 확인 다이얼로그 */}
        <Dialog open={showDeleteFoodDialog} onOpenChange={setShowDeleteFoodDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>음식 카탈로그 삭제 확인</DialogTitle>
            </DialogHeader>
            <DialogDescription>
              정말로 이 음식을 카탈로그에서 삭제하시겠습니까? 
              이 작업은 되돌릴 수 없으며, 기존 식단 기록에는 영향을 주지 않습니다.
            </DialogDescription>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDeleteFoodDialog(false)}>취소</Button>
              <Button variant="destructive" onClick={() => handleDeleteFoodCatalog(deleteFoodCatalogId!)}>삭제</Button>
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

        {/* 음식 카탈로그 수정 모달 */}
        <Dialog open={showEditFoodModal} onOpenChange={setShowEditFoodModal}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>음식 카탈로그 수정</DialogTitle>
              <DialogDescription>음식의 영양 정보를 수정할 수 있습니다.</DialogDescription>
            </DialogHeader>
            {editingFoodCatalog && (
              <div className="grid gap-4 py-4">
                {/* 음식명 */}
                <div className="grid gap-2">
                  <Label htmlFor="foodName">음식명</Label>
                  <Input
                    id="foodName"
                    value={editingFoodCatalog.name}
                    onChange={(e) => setEditingFoodCatalog(prev => 
                      prev ? { ...prev, name: e.target.value } : null
                    )}
                    placeholder="음식명을 입력하세요"
                  />
                </div>

                {/* 기준량 */}
                <div className="grid gap-2">
                  <Label htmlFor="servingSize">기준량(g)</Label>
                  <Input
                    id="servingSize"
                    type="number"
                    value={editingFoodCatalog.servingSize}
                    onChange={(e) => setEditingFoodCatalog(prev => 
                      prev ? { ...prev, servingSize: Number(e.target.value) } : null
                    )}
                    placeholder="기준량을 입력하세요"
                  />
                </div>

                {/* 칼로리 */}
                <div className="grid gap-2">
                  <Label htmlFor="calories">칼로리(kcal)</Label>
                  <Input
                    id="calories"
                    type="number"
                    step="0.1"
                    value={editingFoodCatalog.calories}
                    onChange={(e) => setEditingFoodCatalog(prev => 
                      prev ? { ...prev, calories: Number(e.target.value) } : null
                    )}
                    placeholder="칼로리를 입력하세요"
                  />
                </div>

                {/* 탄수화물 */}
                <div className="grid gap-2">
                  <Label htmlFor="carbs">탄수화물(g)</Label>
                  <Input
                    id="carbs"
                    type="number"
                    step="0.1"
                    value={editingFoodCatalog.carbs}
                    onChange={(e) => setEditingFoodCatalog(prev => 
                      prev ? { ...prev, carbs: Number(e.target.value) } : null
                    )}
                    placeholder="탄수화물을 입력하세요"
                  />
                </div>

                {/* 단백질 */}
                <div className="grid gap-2">
                  <Label htmlFor="protein">단백질(g)</Label>
                  <Input
                    id="protein"
                    type="number"
                    step="0.1"
                    value={editingFoodCatalog.protein}
                    onChange={(e) => setEditingFoodCatalog(prev => 
                      prev ? { ...prev, protein: Number(e.target.value) } : null
                    )}
                    placeholder="단백질을 입력하세요"
                  />
                </div>

                {/* 지방 */}
                <div className="grid gap-2">
                  <Label htmlFor="fat">지방(g)</Label>
                  <Input
                    id="fat"
                    type="number"
                    step="0.1"
                    value={editingFoodCatalog.fat}
                    onChange={(e) => setEditingFoodCatalog(prev => 
                      prev ? { ...prev, fat: Number(e.target.value) } : null
                    )}
                    placeholder="지방을 입력하세요"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowEditFoodModal(false);
                  setEditingFoodCatalog(null);
                }}
                disabled={isUpdatingFood}
              >
                취소
              </Button>
              <Button 
                onClick={handleUpdateFoodCatalog}
                disabled={isUpdatingFood || !editingFoodCatalog?.name.trim()}
              >
                {isUpdatingFood ? '수정 중...' : '수정 완료'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};
