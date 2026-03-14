import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div className={`bg-neutral-200 dark:bg-neutral-800 animate-pulse ${className}`} />
);

export const ProfileSkeleton: React.FC = () => (
  <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 pb-20">
    <div className="h-48 w-full bg-neutral-200 dark:bg-neutral-900 animate-pulse" />
    <div className="mx-auto max-w-2xl px-4 -mt-12 relative z-10">
      <div className="bg-white dark:bg-neutral-900 rounded-[32px] shadow-2xl p-6 space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-24 w-24 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse border-4 border-white dark:border-neutral-900 shadow-lg" />
          <div className="h-8 w-48 bg-neutral-100 dark:bg-neutral-800 rounded-xl animate-pulse" />
          <div className="h-4 w-32 bg-neutral-50 dark:bg-neutral-700 rounded-lg animate-pulse" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full animate-pulse" />
          <div className="h-3 w-3/4 bg-neutral-100 dark:bg-neutral-800 rounded-full animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
          <div className="h-14 rounded-2xl bg-neutral-100 dark:bg-neutral-800 animate-pulse" />
        </div>
      </div>
    </div>
  </div>
);

export const CommentSkeleton: React.FC = () => (
  <div className="flex gap-3 py-4">
    <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 animate-pulse shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-24 bg-neutral-100 dark:bg-neutral-800 rounded animate-pulse" />
      <div className="h-3 w-full bg-neutral-50 dark:bg-neutral-900 rounded animate-pulse" />
    </div>
  </div>
);

export default Skeleton;
