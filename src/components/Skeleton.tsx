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
  <div className={`relative overflow-hidden bg-neutral-200 ${className}`}>
    <Shimmer />
  </div>
);

export const ItemCardSkeleton = () => (
  <div className="rounded-3xl bg-white dark:bg-neutral-900 border border-neutral-100 dark:border-neutral-800 overflow-hidden shadow-sm">
    <Skeleton className="aspect-[4/3] w-full dark:bg-neutral-800" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-6 w-3/4 rounded-lg dark:bg-neutral-800" />
      <Skeleton className="h-4 w-full rounded-lg dark:bg-neutral-800" />
      <div className="pt-4 border-t border-neutral-100 dark:border-neutral-800 flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-12 rounded-sm dark:bg-neutral-800" />
          <Skeleton className="h-8 w-24 rounded-lg dark:bg-neutral-800" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full dark:bg-neutral-800" />
      </div>
    </div>
  </div>
);

export const PostCardSkeleton = () => (
  <div className="bg-white dark:bg-neutral-900 rounded-3xl border border-neutral-100 dark:border-neutral-800 overflow-hidden shadow-sm mb-6">
    <div className="p-4 flex items-center gap-3">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0 dark:bg-neutral-800" />
      <div className="space-y-2 flex-1 min-w-0">
        <Skeleton className="h-4 w-32 rounded-lg dark:bg-neutral-800" />
        <Skeleton className="h-3 w-20 rounded-lg dark:bg-neutral-800" />
      </div>
    </div>
    <div className="px-4 pb-3 space-y-2">
      <Skeleton className="h-4 w-full rounded-lg dark:bg-neutral-800" />
      <Skeleton className="h-4 w-2/3 rounded-lg dark:bg-neutral-800" />
    </div>
    <div className="px-4 mb-4">
      <Skeleton className="aspect-video w-full rounded-2xl dark:bg-neutral-800" />
    </div>
    <div className="px-4 py-3 border-t border-neutral-50 dark:border-neutral-800 flex gap-6">
      <Skeleton className="h-4 w-16 rounded-md dark:bg-neutral-800" />
      <Skeleton className="h-4 w-16 rounded-md dark:bg-neutral-800" />
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
