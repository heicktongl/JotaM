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
  <div className="rounded-3xl bg-white border border-neutral-100 overflow-hidden shadow-sm">
    <Skeleton className="aspect-[4/3] w-full" />
    <div className="p-5 space-y-3">
      <Skeleton className="h-6 w-3/4 rounded-lg" />
      <Skeleton className="h-4 w-1/2 rounded-lg" />
      <div className="pt-4 border-t border-neutral-100 flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-12 rounded-sm" />
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  </div>
);

export const PostCardSkeleton = () => (
  <div className="bg-white rounded-3xl border border-neutral-100 p-4 mb-6 shadow-sm">
    <div className="flex items-center gap-3 mb-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-32 rounded-lg" />
        <Skeleton className="h-3 w-20 rounded-lg" />
      </div>
    </div>
    <div className="space-y-2 mb-4">
      <Skeleton className="h-4 w-full rounded-lg" />
      <Skeleton className="h-4 w-full rounded-lg" />
      <Skeleton className="h-4 w-2/3 rounded-lg" />
    </div>
    <Skeleton className="aspect-video w-full rounded-2xl" />
    <div className="mt-4 pt-4 border-t border-neutral-50 flex gap-6">
      <Skeleton className="h-4 w-16 rounded-md" />
      <Skeleton className="h-4 w-16 rounded-md" />
    </div>
  </div>
);
