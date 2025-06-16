
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

interface StructuredDataPreviewProps {
  structuredData: any;
  isSuccess: boolean;
}

export const StructuredDataPreview: React.FC<StructuredDataPreviewProps> = ({
  structuredData,
  isSuccess
}) => {
  if (!structuredData || !isSuccess) {
    return null;
  }

  return (
    <Card className="mb-6 border-green-200 bg-green-50 animate-slide-up">
      <CardHeader>
        <CardTitle className="flex items-center text-green-700">
          <CheckCircle className="mr-2 h-5 w-5" />
          구조화된 데이터
        </CardTitle>
      </CardHeader>
      <CardContent>
        <pre className="text-sm bg-white p-3 rounded border overflow-x-auto">
          {JSON.stringify(structuredData, null, 2)}
        </pre>
      </CardContent>
    </Card>
  );
};
