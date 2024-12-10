'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShowcaseGrid } from '@/components/showcase/ShowcaseGrid';
import { ShowcaseHeader } from '@/components/showcase/ShowcaseHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { BackButton } from '@/components/ui/BackButton';

interface Site {
  siteId: string;
  url: string;
  createdAt: string;
}

interface SitesResponse {
  sites: Site[];
  hasMore: boolean;
  nextCursor: string | null;
}

export default function ShowcasePage() {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const router = useRouter();

  const fetchSites = async (cursor?: string) => {
    try {
      const url = new URL('/api/showcase', window.location.origin);
      if (cursor) {
        url.searchParams.set('startAfter', cursor);
      }
      
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch sites');
      }
      
      const data: SitesResponse = await response.json();
      
      if (cursor) {
        setSites(prev => [...prev, ...data.sites]);
      } else {
        setSites(data.sites);
      }
      
      setHasMore(data.hasMore);
      setNextCursor(data.nextCursor);
    } catch (err) {
      setError('Failed to load sites');
      console.error(err);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  const handleLoadMore = () => {
    if (nextCursor) {
      setIsLoadingMore(true);
      fetchSites(nextCursor);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-purple-500/[0.02]" />

      <BackButton />

      <div className="max-w-7xl mx-auto space-y-8 relative z-10 pt-16 sm:pt-0">
        <ShowcaseHeader />
        
        {isLoading && <LoadingSpinner />}
        {error && <ErrorMessage message={error} />}
        
        <ShowcaseGrid 
          sites={sites}
          hasMore={hasMore}
          isLoading={isLoading}
          isLoadingMore={isLoadingMore}
          onLoadMore={handleLoadMore}
          error={error}
        />
      </div>
    </div>
  );
} 