import React from 'react';

export const SearchSkeleton: React.FC = () => {
  return (
    <div className="space-y-10">
      {/* 🦴 Top Featured Skeleton (Simulando as vitrines em destaque) */}
      <section>
        <div className="flex items-center gap-2 mb-4">
           <div className="h-6 w-6 bg-neutral-200 rounded-lg animate-pulse shadow-sm" />
           <div className="h-6 w-40 bg-neutral-200 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-4 overflow-hidden -mx-6 px-6">
          {[1, 2].map((i) => (
            <div key={i} className="min-w-[240px] flex flex-col bg-white rounded-3xl overflow-hidden shadow-lg shadow-neutral-200/50 border-none transition-all">
              <div className="h-28 w-full bg-neutral-100 relative shimmer-shine">
                <div className="absolute top-2 left-2 h-4 w-16 bg-neutral-200/50 rounded-full" />
                {/* Avatar Shadow Circle */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-6 h-16 w-16 rounded-2xl bg-white shadow-xl flex items-center justify-center p-1">
                  <div className="h-full w-full rounded-2xl bg-neutral-200 shimmer-shine shadow-inner" />
                </div>
              </div>
              <div className="p-5 pt-10 space-y-3">
                <div className="h-4 w-3/4 bg-neutral-200 rounded-full shimmer-shine mx-auto" />
                <div className="h-3 w-1/2 bg-neutral-100 rounded-full shimmer-shine mx-auto" />
                <div className="flex justify-center gap-2 mt-2">
                   <div className="h-3 w-12 bg-neutral-50 rounded-full shimmer-shine" />
                   <div className="h-3 w-12 bg-neutral-50 rounded-full shimmer-shine" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 🦴 List Items Skeleton (Simulando produtos/serviços) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
           <div className="h-6 w-6 bg-neutral-200 rounded-lg animate-pulse shadow-sm" />
           <div className="h-6 w-56 bg-neutral-200 rounded-lg animate-pulse" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="w-full flex items-center gap-4 bg-white rounded-[2rem] p-4 shadow-md shadow-neutral-100/50 border-none">
            {/* Image Skeleton with high shadow */}
            <div className="shrink-0 h-20 w-20 rounded-[1.5rem] bg-neutral-100 shimmer-shine shadow-xl shadow-neutral-200/40" />
            
            <div className="flex-1 space-y-2.5">
              <div className="h-4 w-2/3 bg-neutral-200 rounded-full shimmer-shine" />
              <div className="h-3.5 w-1/3 bg-neutral-100 rounded-full shimmer-shine" />
              <div className="flex gap-2.5 pt-1">
                <div className="h-4 w-16 bg-neutral-50 rounded-full shimmer-shine" />
                <div className="h-4 w-20 bg-neutral-50 rounded-full shimmer-shine" />
              </div>
            </div>

            {/* Circular action button with shadow */}
            <div className="h-10 w-10 rounded-full bg-neutral-100 shimmer-shine shadow-lg shadow-neutral-200/50 flex items-center justify-center shrink-0">
               <div className="h-4 w-4 bg-white/50 rounded-full" />
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
