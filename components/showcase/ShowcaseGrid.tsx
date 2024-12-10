import { SiteCard } from './SiteCard';
import { LoadMoreButton } from '../ui/LoadMoreButton';
import { EmptyState } from '../ui/EmptyState';

interface ShowcaseGridProps {
  sites: Array<{
    siteId: string;
    url: string;
    createdAt: string;
  }>;
  hasMore: boolean;
  isLoading: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
  error: string;
}

export function ShowcaseGrid({
  sites,
  hasMore,
  isLoading,
  isLoadingMore,
  onLoadMore,
  error
}: ShowcaseGridProps) {
  if (!isLoading && !error && sites.length === 0) {
    return <EmptyState message="No sites found" />;
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sites.map((site) => (
          <SiteCard key={site.siteId} site={site} />
        ))}
      </div>

      {hasMore && !isLoading && !error && (
        <LoadMoreButton 
          onClick={onLoadMore}
          isLoading={isLoadingMore}
        />
      )}
    </>
  );
} 