
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle, Sparkles } from 'lucide-react';

interface AIFeedback {
  type: 'success' | 'incomplete' | 'clarification' | 'error';
  message: string;
  suggestions?: string[];
  missingFields?: string[];
}

interface AIFeedbackProps {
  aiFeedback: AIFeedback;
  clarificationInput: string;
  setClarificationInput: (input: string) => void;
  onClarificationSubmit: () => void;
  onSaveRecord: () => void;
  structuredData: any;
}

export const AIFeedbackComponent: React.FC<AIFeedbackProps> = ({
  aiFeedback,
  clarificationInput,
  setClarificationInput,
  onClarificationSubmit,
  onSaveRecord,
  structuredData
}) => {
  const getFeedbackIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Sparkles className="h-5 w-5 text-blue-600" />;
    }
  };

  const getFeedbackBorderColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      case 'incomplete':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Card className={`mb-6 animate-slide-up ${getFeedbackBorderColor(aiFeedback.type)}`}>
      <CardHeader>
        <CardTitle className="flex items-center">
          {getFeedbackIcon(aiFeedback.type)}
          <span className="ml-2">
            AI 피드백
            {aiFeedback.type === 'incomplete' && ' - 추가 정보 필요'}
            {aiFeedback.type === 'clarification' && ' - 명확화 필요'}
            {aiFeedback.type === 'error' && ' - 오류'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{aiFeedback.message}</p>
        
        {aiFeedback.suggestions && (
          <div className="space-y-2">
            <p className="text-sm font-medium">💡 제안사항:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {aiFeedback.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {aiFeedback.missingFields && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-orange-700">📝 누락된 정보:</p>
            <div className="flex flex-wrap gap-2">
              {aiFeedback.missingFields.map((field, index) => (
                <Badge key={index} variant="outline" className="text-orange-700 border-orange-300">
                  {field}
                </Badge>
              ))}
            </div>
            
            <div className="flex gap-2">
              <Input
                placeholder="추가 정보를 입력하세요..."
                value={clarificationInput}
                onChange={(e) => setClarificationInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && onClarificationSubmit()}
              />
              <Button 
                onClick={onClarificationSubmit}
                disabled={!clarificationInput.trim()}
                size="sm"
              >
                추가
              </Button>
            </div>
          </div>
        )}
        
        {aiFeedback.type === 'success' && structuredData && (
          <Button 
            onClick={onSaveRecord}
            className="w-full gradient-bg hover:opacity-90 transition-opacity"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            기록 저장하기
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
