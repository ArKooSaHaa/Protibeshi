interface ListingSkeletonGridProps {
  count?: number;
}

export const ListingSkeletonGrid = ({ count = 6 }: ListingSkeletonGridProps) => {
  return (
    <div className="amp-skeleton-grid" aria-label="Loading listings" aria-busy="true">
      {Array.from({ length: count }).map((_, index) => (
        <article key={`amp-skeleton-${index}`} className="amp-skeleton-card">
          <div className="amp-skeleton-image" />
          <div className="amp-skeleton-line amp-skeleton-line-title" />
          <div className="amp-skeleton-line" />
          <div className="amp-skeleton-line amp-skeleton-line-short" />
          <div className="amp-skeleton-actions">
            <div className="amp-skeleton-pill" />
            <div className="amp-skeleton-pill" />
            <div className="amp-skeleton-pill" />
          </div>
        </article>
      ))}
    </div>
  );
};
