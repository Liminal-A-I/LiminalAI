"use client";

import { useState } from "react";
import Prism from "prismjs";
import "prismjs/themes/prism-tomorrow.css";

interface Props {
  html: string;
  setHtml: (html: string | null) => void;
}

function TabButton({ isActive, onClick, children }: { isActive: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 relative group ${
        isActive 
          ? "text-blue-400 bg-gray-800/50 border border-blue-500/20" 
          : "text-gray-400 hover:text-blue-400 border border-transparent"
      }`}
    >
      {children}
      {isActive && (
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/10 to-transparent animate-shimmer" />
        </div>
      )}
    </button>
  );
}

export function AgentExecutionResult({ html, setHtml }: Props) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [isHosting, setIsHosting] = useState(false);
  const [hostedUrl, setHostedUrl] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(html);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleHost = async () => {
    setIsHosting(true);
    setError(null);
    try {
      // Generate a unique siteId using timestamp and random string
      const siteId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      
      // Create pages array with the HTML content
      const pages = [{
        path: '/index.html',
        html: html
      }];

      const response = await fetch("/api/host", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ pages, siteId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to deploy site');
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error('No deployment URL received');
      }
      setHostedUrl(data.url);
    } catch (error) {
      console.error("Failed to host:", error);
      setError(error instanceof Error ? error.message : 'Failed to deploy site');
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsHosting(false);
    }
  };

  return (
    <div 
      className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl w-[90vw] max-w-6xl max-h-[90vh] shadow-2xl border border-gray-700/50 overflow-hidden relative"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Error Toast */}
      {error && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 mt-4 bg-red-500/90 text-white px-4 py-2 rounded-lg shadow-xl border border-red-500/50 backdrop-blur-sm z-50 animate-slideDown flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      {/* Background Effects */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-purple-500/[0.02]" />
      <div className="absolute inset-0 circuit-pattern opacity-[0.02]" />

      {/* Header */}
      <div className="bg-gray-800/50 backdrop-blur-sm p-4 border-b border-gray-700/50 flex items-center justify-between relative z-10">
        <div className="flex items-center space-x-4">
          {/* Window Controls */}
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80 shadow-lg shadow-red-500/20" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/80 shadow-lg shadow-yellow-500/20" />
            <div className="w-3 h-3 rounded-full bg-green-500/80 shadow-lg shadow-green-500/20" />
          </div>

          {/* Tabs */}
          <div className="flex items-center space-x-2 ml-4">
            <TabButton isActive={activeTab === "preview"} onClick={() => setActiveTab("preview")}>
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>Preview</span>
              </div>
            </TabButton>
            <TabButton isActive={activeTab === "code"} onClick={() => setActiveTab("code")}>
              <div className="flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <span>Code</span>
              </div>
            </TabButton>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {activeTab === "code" && (
            <button
              onClick={handleCopyCode}
              className="flex items-center space-x-2 px-3 py-1.5 bg-gray-900/50 text-blue-400 rounded-lg border border-gray-700/50 hover:border-blue-500/50 transition-all duration-200 text-sm font-medium"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>{isCopied ? "Copied!" : "Copy Code"}</span>
            </button>
          )}
          <button
            onClick={hostedUrl ? () => window.open(hostedUrl, '_blank') : handleHost}
            disabled={isHosting}
            className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20 hover:bg-blue-500/20 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isHosting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500/20 border-t-blue-500"></div>
                <span>Deploying Site...</span>
              </>
            ) : hostedUrl ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                <span>View Deployment</span>
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>Deploy Site</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {activeTab === "preview" ? (
          <div className="h-[70vh] bg-white rounded-lg m-4 overflow-hidden border border-gray-700/50">
            <iframe srcDoc={html} className="w-full h-full" />
          </div>
        ) : (
          <div className="h-[70vh] overflow-auto m-4 rounded-lg bg-gray-900/50 border border-gray-700/50">
            <pre className="p-4">
              <code
                className="language-html"
                dangerouslySetInnerHTML={{
                  __html: Prism.highlight(html, Prism.languages.html, "html"),
                }}
              />
            </pre>
          </div>
        )}
      </div>

    </div>
  );
}
