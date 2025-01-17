'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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


export default function SitesGallery() {
  const [sites, setSites] = useState<Site[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const router = useRouter();

  const fetchSites = async (cursor?: string) => {
    try {
      const url = new URL('/api/gallery', window.location.origin);
      if (cursor) {
        url.searchParams.set('startAfter', cursor);
      }
      
      console.log('Fetching sites with cursor:', cursor);
      const response = await fetch(url.toString());
      if (!response.ok) {
        throw new Error('Failed to fetch sites');
      }
      
      const data: SitesResponse = await response.json();
      console.log('Received sites:', data.sites.length, 'hasMore:', data.hasMore);
      
      if (cursor) {
        // Append new sites
        setSites(prev => [...prev, ...data.sites]);
      } else {
        // Replace sites for initial load
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
      {/* Animated background patterns */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-purple-500/[0.02]" />

      {/* Back Button */}
      <button
        onClick={() => router.push('/')}
        className="fixed top-4 left-4 z-50 flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors group bg-gray-900/50 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-700/50 hover:border-blue-500/50"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-5 w-5 transform group-hover:-translate-x-1 transition-transform" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        <span className="font-medium">Back to Canvas</span>
      </button>

      <div className="max-w-7xl mx-auto space-y-8 relative z-10 pt-16 sm:pt-0">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-block">
            <div className="relative">
              <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 bg-clip-text text-transparent pb-2">
                Liminal AI Gallery
              </h1>
              <div className="absolute -bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0" />
            </div>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Explore websites generated by our advanced AI engine. Each site represents a unique fusion of human creativity and artificial intelligence.
          </p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" />
            </div>
            <div className="text-blue-400 font-mono text-sm">Loading sites...</div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <div className="text-red-400 font-mono">{error}</div>
          </div>
        )}

        {/* Sites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sites.map((site) => (
            <SiteCard key={site.siteId} site={site} />
          ))}
        </div>

        {/* Load More Button */}
        {hasMore && !isLoading && !error && (
          <div className="flex justify-center pt-8 pb-4">
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium shadow-lg shadow-blue-500/25 py-3 px-6 text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isLoadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Loading More...</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span>Load More</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && sites.length === 0 && (
          <div className="text-center py-20">
            <div className="text-gray-400 font-mono">No sites found</div>
          </div>
        )}
      </div>
    </div>
  );
} 