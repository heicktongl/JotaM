import React from 'react';
import { motion } from 'motion/react';

const Shimmer = () => (
  <motion.div
    initial={{ x: '-100%' }}
    animate={{ x: '100%' }}
    transition={{
      repeat: Infinity,
      duration: 2,
      ease: [0.4, 0, 0.6, 1],
    }}
    className="absolute inset-0 bg-gradient-to-r from-transparent via-neutral-100/10 dark:via-white/5 to-transparent z-10"
  />
);

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={`relative overflow-hidden bg-neutral-100/50 dark:bg-neutral-800/20 backdrop-blur-[2px] ${className}`}>
    <Shimmer />
  </div>
);

export const ItemCardSkeleton = () => (
  <div className="block h-full animate-pulse-slow">
    <div className="group relative flex flex-col h-full overflow-hidden rounded-[2rem] border border-neutral-100/50 dark:border-neutral-800/50 bg-white dark:bg-neutral-900 shadow-sm">
      {/* Image Section Skeleton */}
      <Skeleton className="aspect-[4/3] w-full" />
      
      {/* Content Section Skeleton */}
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-4 space-y-3">
          <Skeleton className="h-5 w-3/4 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-full rounded-lg" />
            <Skeleton className="h-3 w-5/6 rounded-lg" />
          </div>
        </div>

        {/* Footer Section Skeleton */}
        <div className="mt-auto pt-5 border-t border-neutral-100/80 dark:border-neutral-800/80 flex items-end justify-between">
          <div className="space-y-2">
            <Skeleton className="h-2 w-12 rounded-full" />
            <Skeleton className="h-7 w-32 rounded-xl" />
          </div>
          <Skeleton className="h-11 w-11 rounded-full" />
        </div>
      </div>
    </div>
  </div>
);

export const PostCardSkeleton = () => (
  <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-neutral-100/50 dark:border-neutral-800/50 overflow-hidden shadow-sm mb-6 animate-pulse-slow">
    {/* Header Skeleton */}
    <div className="p-5 flex items-center gap-4">
      <Skeleton className="h-11 w-11 rounded-full flex-shrink-0" />
      <div className="space-y-2 flex-1 min-w-0">
        <Skeleton className="h-4 w-40 rounded-xl" />
        <Skeleton className="h-2.5 w-24 rounded-full" />
      </div>
    </div>

    {/* Content Skeleton */}
    <div className="px-5 pb-4 space-y-2.5">
      <Skeleton className="h-3.5 w-full rounded-lg" />
      <Skeleton className="h-3.5 w-11/12 rounded-lg" />
    </div>

    {/* Hero Image Skeleton */}
    <div className="px-5 mb-5 uppercase">
      <Skeleton className="aspect-square sm:aspect-video max-h-[500px] w-full rounded-[1.5rem]" />
    </div>

    {/* Actions Skeleton */}
    <div className="px-5 py-4 border-t border-neutral-50 dark:border-neutral-800 flex items-center gap-8">
      <Skeleton className="h-4 w-16 rounded-full" />
      <Skeleton className="h-4 w-16 rounded-full" />
      <Skeleton className="h-4 w-10 rounded-full ml-auto" />
    </div>
  </div>
);

export const CommentSkeleton = () => (
  <div className="flex gap-4 px-3 py-1">
    <Skeleton className="h-12 w-12 rounded-2xl flex-shrink-0" />
    <div className="flex-1 space-y-3">
      <div className="flex justify-between items-center pr-2">
        <Skeleton className="h-3 w-28 rounded-full" />
        <Skeleton className="h-2 w-10 rounded-full" />
      </div>
      <Skeleton className="h-14 w-full rounded-[1.25rem] rounded-tl-none" />
    </div>
  </div>
);

export const ProfileSkeleton = () => (
  <div className="min-h-screen bg-neutral-50 pb-24 animate-pulse-slow">
    {/* Cover Skeleton */}
    <Skeleton className="h-48 md:h-64 w-full" />
    
    <div className="mx-auto max-w-7xl px-4 sm:px-6 relative">
      {/* Avatar Skeleton */}
      <div className="relative -mt-16 mb-8 flex flex-col items-center">
        <div className="p-1 rounded-full bg-white shadow-xl relative z-20">
          <Skeleton className="h-32 w-32 rounded-full border-4 border-white" />
        </div>
        
        {/* Info Skeleton */}
        <div className="mt-6 flex flex-col items-center gap-3 w-full">
          <Skeleton className="h-8 w-64 rounded-xl" />
          <Skeleton className="h-4 w-32 rounded-full" />
          <div className="mt-4 space-y-2 w-full max-w-md">
            <Skeleton className="h-3 w-full rounded-lg" />
            <Skeleton className="h-3 w-4/5 rounded-lg mx-auto" />
          </div>
        </div>

        {/* Metrics Skeleton */}
        <div className="mt-10 flex gap-8 justify-center w-full">
          <div className="space-y-2 flex flex-col items-center">
            <Skeleton className="h-6 w-12 rounded-lg" />
            <Skeleton className="h-2 w-16 rounded-full" />
          </div>
          <div className="space-y-2 flex flex-col items-center">
            <Skeleton className="h-6 w-12 rounded-lg" />
            <Skeleton className="h-2 w-16 rounded-full" />
          </div>
          <div className="space-y-2 flex flex-col items-center">
            <Skeleton className="h-6 w-12 rounded-lg" />
            <Skeleton className="h-2 w-16 rounded-full" />
          </div>
        </div>

        {/* Buttons Skeleton */}
        <div className="mt-10 flex flex-col sm:flex-row gap-3 w-full max-w-md px-4">
          <Skeleton className="h-12 flex-1 rounded-full" />
          <Skeleton className="h-12 flex-1 rounded-full" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
        <ItemCardSkeleton />
        <ItemCardSkeleton />
        <ItemCardSkeleton />
      </div>
    </div>
  </div>
);

export const StorefrontSkeleton = () => (
  <div className="w-full flex items-center gap-4 bg-transparent rounded-2xl p-4 animate-pulse-slow">
    <Skeleton className="shrink-0 h-12 w-12 rounded-full" />
    <div className="flex-1 space-y-2">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-32 rounded-lg" />
        <Skeleton className="h-3 w-12 rounded-full" />
      </div>
      <Skeleton className="h-3 w-full rounded-lg" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-2 w-20 rounded-full" />
        <Skeleton className="h-2 w-16 rounded-full" />
      </div>
    </div>
    <Skeleton className="h-5 w-5 rounded-full" />
  </div>
);

export const UserHomeProfileSkeleton = () => (
  <div className="animate-pulse-slow space-y-8">
    <div className="space-y-4">
      <Skeleton className="h-3 w-24 rounded-full" />
      <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm">
        <div className="grid grid-cols-3 divide-x divide-neutral-100 bg-neutral-50/30">
          <div className="p-4 space-y-2 flex flex-col items-center">
            <Skeleton className="h-6 w-10 rounded-lg" />
            <Skeleton className="h-2 w-12 rounded-full" />
          </div>
          <div className="p-4 space-y-2 flex flex-col items-center">
            <Skeleton className="h-6 w-10 rounded-lg" />
            <Skeleton className="h-2 w-12 rounded-full" />
          </div>
          <div className="p-4 space-y-2 flex flex-col items-center">
            <Skeleton className="h-6 w-10 rounded-lg" />
            <Skeleton className="h-2 w-12 rounded-full" />
          </div>
        </div>
        <div className="p-4 space-y-4">
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>
    </div>
    
    <div className="space-y-4">
      <Skeleton className="h-3 w-24 rounded-full" />
      <div className="bg-white rounded-3xl border border-neutral-100 overflow-hidden shadow-sm p-4 space-y-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
        <Skeleton className="h-12 w-full rounded-2xl" />
      </div>
    </div>
  </div>
);
