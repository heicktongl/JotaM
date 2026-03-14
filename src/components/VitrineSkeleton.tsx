import React from 'react';

export const VitrineSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20">
      {/* Cover Skeleton */}
      <div className="h-48 w-full bg-neutral-200 dark:bg-neutral-900 shimmer-shine" />

      {/* Main Card Skeleton */}
      <div className="mx-auto max-w-2xl px-4 -mt-12 relative z-10">
        <div className="bg-white dark:bg-neutral-900 rounded-[32px] shadow-2xl overflow-hidden p-6 space-y-6">
          
          {/* Header Raio-X */}
          <div className="flex flex-col items-center text-center space-y-4">
            {/* Avatar Circle */}
            <div className="h-24 w-24 rounded-full bg-neutral-100 dark:bg-neutral-800 shimmer-shine border-4 border-white dark:border-neutral-900 shadow-lg" />
            
            <div className="space-y-2 w-full flex flex-col items-center">
              {/* Title/Name */}
              <div className="h-8 w-48 bg-neutral-100 dark:bg-neutral-800 rounded-xl shimmer-shine" />
              {/* Username */}
              <div className="h-4 w-32 bg-neutral-50 dark:bg-neutral-700 rounded-lg shimmer-shine opacity-60" />
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex justify-center gap-8 py-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className="h-5 w-8 bg-neutral-100 dark:bg-neutral-800 rounded-md shimmer-shine" />
                <div className="h-3 w-12 bg-neutral-50 dark:bg-neutral-800 rounded-md shimmer-shine opacity-40" />
              </div>
            ))}
          </div>

          {/* Bio Skeleton */}
          <div className="space-y-2">
            <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full shimmer-shine" />
            <div className="h-3 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded-full shimmer-shine" />
          </div>

          {/* Location & Time Row */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-full bg-neutral-200 dark:bg-neutral-800 shimmer-shine" />
              <div className="h-4 w-24 bg-neutral-100 dark:bg-neutral-800 rounded-lg shimmer-shine" />
            </div>
            <div className="h-6 w-20 bg-orange-100 dark:bg-orange-900/30 rounded-full shimmer-shine" />
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 shimmer-shine" />
            <div className="h-14 rounded-2xl bg-orange-50 dark:bg-orange-950/20 shimmer-shine" />
          </div>
        </div>

        {/* Tab Selector Skeleton */}
        <div className="mt-8 flex gap-4 h-12">
          <div className="flex-1 rounded-2xl bg-white dark:bg-neutral-900 shadow-sm shimmer-shine" />
          <div className="flex-1 rounded-2xl bg-neutral-100 dark:bg-neutral-800 opacity-50 shimmer-shine" />
        </div>

        {/* Grid items skeleton */}
        <div className="mt-8 grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-square rounded-3xl bg-white dark:bg-neutral-900 shadow-lg p-3 space-y-3 overflow-hidden">
               <div className="w-full aspect-square rounded-2xl bg-neutral-100 dark:bg-neutral-800 shimmer-shine" />
               <div className="h-3 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded-full shimmer-shine" />
               <div className="h-4 w-1/2 bg-neutral-100 dark:bg-neutral-800 rounded-full shimmer-shine" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
