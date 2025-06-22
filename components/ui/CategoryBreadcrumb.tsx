import React from 'react';
import { Tag } from 'lucide-react';

interface CategoryBreadcrumbProps {
  category: string;
  className?: string;
}

export const CategoryBreadcrumb: React.FC<CategoryBreadcrumbProps> = ({ category, className }) => {
  const parts = category.split(' > ').map(p => p.trim());

  return (
    <div className={`flex items-center space-x-2 text-sm ${className}`}>
      <Tag className="w-4 h-4 text-slate-400 flex-shrink-0" />
      <span className="text-slate-300 font-medium">Category:</span>
      <div className="flex items-center space-x-1.5 bg-slate-800/50 border border-slate-700 rounded-md px-2 py-1">
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            <span className="text-blue-300">
              {part}
            </span>
            {index < parts.length - 1 && (
              <span className="text-slate-500 mx-1">&gt;</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}; 