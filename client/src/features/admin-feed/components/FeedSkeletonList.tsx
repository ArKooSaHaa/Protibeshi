interface FeedSkeletonListProps {
  compact?: boolean;
}

export const FeedSkeletonList = ({ compact = false }: FeedSkeletonListProps) => {
  const rowCount = compact ? 2 : 4;

  return (
    <div className="afd-skeleton-list" aria-label="Loading posts" aria-busy="true">
      {Array.from({ length: rowCount }).map((_, index) => (
        <div key={`skeleton-${index}`} className="afd-skeleton-card">
          <div className="afd-skeleton-row afd-skeleton-short" />
          <div className="afd-skeleton-row" />
          <div className="afd-skeleton-row" />
          <div className="afd-skeleton-row afd-skeleton-medium" />
        </div>
      ))}
    </div>
  );
};
