import React from 'react';
import { motion } from 'motion/react';

const Shimmer = () => (
  <motion.div
    initial={{ x: '-100%' }}
    animate={{ x: '100%' }}
    transition={{
      repeat: Infinity,
      duration: 1.5,
      ease: 'linear',
    }}
    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
  />
);

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`relative overflow-hidden bg-neutral-100 dark:bg-neutral-800/50 ${className}`}>
    <Shimmer />
  </div>
);

export const ItemCardSkeleton = () => (
  <div className="group relative flex h-full w-full flex-col overflow-hidden rounded-3xl border border-neutral-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm transition-all">
    <Skeleton className="aspect-[4/3] w-full" />
    <div className="flex flex-1 flex-col p-5">
      <div className="mb-2 space-y-2">
        <Skeleton className="h-6 w-full rounded-lg" />
      </div>
      <div className="mb-4 space-y-2">
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-4/5 rounded-lg" />
      </div>
      <div className="mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16 rounded-sm" />
          <Skeleton className="h-8 w-28 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  </div>
);

export const PostCardSkeleton = () => (
  <div className="w-full bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 overflow-hidden shadow-sm mb-6">
    <div className="p-4 flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="space-y-2 flex-1 min-w-0">
        <Skeleton className="h-4 w-48 rounded-lg" />
        <Skeleton className="h-3 w-24 rounded-lg" />
      </div>
    </div>
    <div className="px-4 pb-3 space-y-2">
      <Skeleton className="h-4 w-full rounded-lg" />
      <Skeleton className="h-4 w-11/12 rounded-lg" />
    </div>
    <div className="px-4 mb-4">
      <Skeleton className="aspect-square max-h-[400px] w-full rounded-2xl" />
    </div>
    <div className="px-4 py-3 border-t border-neutral-50 dark:border-neutral-800 flex items-center gap-6">
      <Skeleton className="h-4 w-20 rounded-md" />
      <Skeleton className="h-4 w-20 rounded-md" />
      <Skeleton className="h-4 w-12 rounded-md ml-auto" />
    </div>
  </div>
);
export const CommentSkeleton = () => (
  <div className="flex gap-4 px-2">
    <Skeleton className="h-11 w-11 rounded-2xl flex-shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="flex justify-between items-center">
        <Skeleton className="h-3 w-20 rounded-md" />
        <Skeleton className="h-2 w-12 rounded-md" />
      </div>
      <Skeleton className="h-12 w-full rounded-2xl" />
    </div>
  </div>
);
