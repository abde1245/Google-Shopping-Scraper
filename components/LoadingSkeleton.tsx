
import React from 'react';

const SkeletonCard: React.FC = () => (
  <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-lg overflow-hidden animate-pulse">
    <div className="aspect-square bg-slate-700"></div>
    <div className="p-4">
      <div className="h-4 bg-slate-700 rounded w-1/4 mb-2"></div>
      <div className="h-5 bg-slate-700 rounded w-3/4 mb-3"></div>
      <div className="h-6 bg-slate-700 rounded w-1/2"></div>
    </div>
  </div>
);

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="mt-12">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;
