export default function LoadingSkeleton() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        {/* Title skeleton */}
        <div className="h-8 w-3/4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        
        {/* Content skeleton */}
        <div className="space-y-2">
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-4/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-3/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-4 w-2/6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
};
