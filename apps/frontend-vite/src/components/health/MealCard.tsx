import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { CheckCircle, Plus } from 'lucide-react';

interface MealCardProps {
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  icon: React.ReactNode;
  isCompleted: boolean;
  calories: number;
  onAdd: () => void;
}

export const MealCard: React.FC<MealCardProps> = ({
  type,
  title,
  icon,
  isCompleted,
  calories,
  onAdd
}) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'breakfast': return 'from-orange-100 to-yellow-100';
      case 'lunch': return 'from-green-100 to-emerald-100';
      case 'dinner': return 'from-blue-100 to-indigo-100';
      case 'snack': return 'from-purple-100 to-pink-100';
      default: return 'from-gray-100 to-gray-200';
    }
  };

  return (
    <Card className={`relative overflow-hidden bg-gradient-to-br ${getBackgroundColor()} border-0 hover:shadow-lg transition-all duration-200`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {icon}
            <span className="font-semibold text-gray-800">{title}</span>
          </div>
          {isCompleted && (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
        </div>
        
        <div className="text-sm text-gray-600 mb-3">
          {isCompleted ? (
            <span>{calories} kcal 섭취</span>
          ) : (
            <span className="text-gray-400">아직 기록이 없어요</span>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onAdd}
          className="w-full justify-center gap-2 hover:bg-white/50"
        >
          <Plus className="h-4 w-4" />
          추가
        </Button>
      </CardContent>
    </Card>
  );
}; 