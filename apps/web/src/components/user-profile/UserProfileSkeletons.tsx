export function UserProfileBannerSkeleton() {
  return (
    <div
      className="w-full min-h-[160px] max-h-[280px] animate-pulse bg-surface-container"
      style={{ aspectRatio: "16 / 4" }}
    />
  );
}

export function UserProfileSidebarSkeleton() {
  return (
    <div className="h-[480px] animate-pulse rounded-xl border border-outline-variant/20 bg-surface-container p-6" />
  );
}

export function UserProfileTabsSkeleton() {
  return (
    <div className="h-12 w-full animate-pulse rounded-lg border border-outline-variant/20 bg-surface-container" />
  );
}

export function UserProfileContentRailSkeleton() {
  return (
    <div className="grid gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-[280px] animate-pulse rounded-xl border border-outline-variant/20 bg-surface-container"
        />
      ))}
    </div>
  );
}
