
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface RecordTypeSelectorProps {
  recordType: 'exercise' | 'diet' | null;
  onTypeSelection: (type: 'exercise' | 'diet') => void;
}

export const RecordTypeSelector: React.FC<RecordTypeSelectorProps> = ({ 
  recordType, 
  onTypeSelection 
}) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-8 animate-slide-up" style={{animationDelay: '0.3s'}}>
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 overflow-hidden ${
          recordType === 'exercise' 
            ? 'border-green-300 shadow-md' 
            : 'border-gray-200 hover:border-green-200'
        }`}
        onClick={() => onTypeSelection('exercise')}
      >
        <div className="relative">
          <div className={`absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 transition-opacity duration-200 ${
            recordType === 'exercise' ? 'opacity-100' : 'opacity-0 hover:opacity-90'
          }`} />
          <CardContent className="relative p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
              <img 
                src="/lovable-uploads/13c3b808-98c5-4da6-8416-f5f8307368af.png" 
                alt="운동 아이콘" 
                className="w-8 h-8"
              />
            </div>
            <h3 className={`font-semibold text-lg mb-1 transition-colors duration-200 ${
              recordType === 'exercise' ? 'text-white' : 'text-foreground'
            }`}>운동 기록</h3>
            <p className={`text-sm transition-colors duration-200 ${
              recordType === 'exercise' ? 'text-white/80' : 'text-muted-foreground'
            }`}>오늘의 운동을 기록하세요</p>
          </CardContent>
        </div>
      </Card>

      <Card 
        className={`cursor-pointer transition-all duration-200 hover:shadow-lg border-2 overflow-hidden ${
          recordType === 'diet' 
            ? 'border-orange-300 shadow-md' 
            : 'border-gray-200 hover:border-orange-200'
        }`}
        onClick={() => onTypeSelection('diet')}
      >
        <div className="relative">
          <div className={`absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 transition-opacity duration-200 ${
            recordType === 'diet' ? 'opacity-100' : 'opacity-0 hover:opacity-90'
          }`} />
          <CardContent className="relative p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
              <img 
                src="/lovable-uploads/b5ac529a-af06-484b-b61f-1096dd7ae416.png" 
                alt="식단 아이콘" 
                className="w-8 h-8"
              />
            </div>
            <h3 className={`font-semibold text-lg mb-1 transition-colors duration-200 ${
              recordType === 'diet' ? 'text-white' : 'text-foreground'
            }`}>식단 기록</h3>
            <p className={`text-sm transition-colors duration-200 ${
              recordType === 'diet' ? 'text-white/80' : 'text-muted-foreground'
            }`}>오늘의 식사를 기록하세요</p>
          </CardContent>
        </div>
      </Card>
    </div>
  );
};
