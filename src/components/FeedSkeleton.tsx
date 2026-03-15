import React from 'react';

export const FeedSkeleton: React.FC = () => {
  return (
    <>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div 
          key={i} 
          className="group relative flex flex-col h-full overflow-hidden rounded-3xl bg-white border border-neutral-100/50 shadow-xl"
        >
          {/* Image Section Skeleton */}
          <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100 shimmer-shine" />

          {/* Content Section Skeleton */}
          <div className="flex flex-1 flex-col p-5 space-y-4">
            <div className="space-y-2">
              <div className="h-5 w-full bg-neutral-200 rounded-full shimmer-shine" />
              <div className="h-4 w-3/4 bg-neutral-100 rounded-full shimmer-shine" />
            </div>

            <div className="space-y-2 pt-2">
              <div className="h-3 w-full bg-neutral-50 rounded-full shimmer-shine" />
              <div className="h-3 w-2/3 bg-neutral-50 rounded-full shimmer-shine" />
            </div>

            {/* Footer Section Skeleton */}
            <div className="mt-auto flex items-end justify-between pt-4 border-t border-neutral-100">
              <div className="space-y-2">
                <div className="h-2 w-10 bg-neutral-100 rounded-full shimmer-shine" />
                <div className="h-6 w-24 bg-neutral-200 rounded-full shimmer-shine" />
              </div>

              <div className="h-10 w-10 rounded-full bg-neutral-100 shimmer-shine shadow-lg shadow-neutral-200/50" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
};
