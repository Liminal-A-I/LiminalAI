"use client";

import dynamic from "next/dynamic";
import "@tldraw/tldraw/tldraw.css";
import { useEditor } from "@tldraw/tldraw";
import { getSvgAsImage } from "@/lib/getSvgAsImage";
import { blobToBase64 } from "@/lib/blobToBase64";
import React, { useEffect, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import { AgentExecutionResult } from "@/components/AgentExecutionResult";
import { FiX } from 'react-icons/fi';
import { PublishingTerminal } from "../components/PublishingTerminal";
import { ErrorBoundary } from "react-error-boundary";

const Tldraw = dynamic(async () => (await import("@tldraw/tldraw")).Tldraw, {
  ssr: false,
});

// Types
interface ExportButtonProps {
  setHtml: (html: string) => void;
}

interface WelcomeDialogProps {
  onClose: () => void;
}

function WelcomeDialog({ onClose }: WelcomeDialogProps) {
  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[3000] animate-fadeIn p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl p-6 w-full max-w-lg relative shadow-2xl border border-gray-700/50 transform transition-all duration-500 animate-slideUp my-4 flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Background Effects */}
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] rounded-2xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.02] to-purple-500/[0.02] rounded-2xl" />

        {/* Close Button */}
        <div className="absolute -top-2 -right-2 z-10">
          <button 
            onClick={onClose}
            className="p-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg shadow-lg transition-all duration-200 hover:scale-105 group border border-gray-700/50 hover:border-blue-500/50"
          >
            <FiX className="w-4 h-4 text-gray-400 group-hover:text-blue-400" />
          </button>
        </div>

        {/* Content Container with Scroll */}
        <div className="relative flex flex-col h-full max-h-[calc(90vh-3rem)] overflow-hidden">
          {/* Logo and Title - Fixed at top */}
          <div className="flex-shrink-0 mb-6">
            <div className="flex flex-col items-center relative">
              <div className="w-20 h-20 bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-lg mb-4 flex items-center justify-center p-3 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100" />
                <img 
                  src="/liminal_logo.png" 
                  alt="Liminal AI Logo" 
                  className="w-full h-full object-contain relative z-10"
                />
                {/* Animated border */}
                <div className="absolute inset-0 rounded-2xl border border-blue-500/20 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/20 to-transparent animate-shimmer" style={{ '--shimmer-speed': '2s' } as any} />
                </div>
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 via-blue-500 to-purple-600 bg-clip-text text-transparent text-center mb-1">
                Welcome to Liminal AI
              </h2>
              <p className="text-blue-400 text-sm font-medium">Transform Your Ideas into Reality</p>
              
              {/* Animated underline */}
              <div className="absolute -bottom-2 left-0 right-0 h-px bg-gradient-to-r from-blue-500/0 via-blue-500/50 to-blue-500/0" />
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
            <div className="space-y-4 text-gray-300">
              <p className="text-sm leading-relaxed text-center">
                Experience the future of web design with our AI-powered canvas. Draw your vision, and watch as our advanced AI engine transforms it into a fully functional website.
              </p>

              {/* How it Works Section */}
              <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50">
                <h3 className="text-sm font-semibold text-blue-400 flex items-center space-x-2 mb-3">
                  <div className="p-1.5 bg-blue-500/10 rounded-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span>How it Works</span>
                </h3>
                <div className="space-y-2">
                  {[
                    { step: 1, text: "Draw your UI design using our intuitive canvas tools" },
                    { step: 2, text: "Click 'Publish Your Site' to activate the AI engine" },
                    { step: 3, text: "Watch as Liminal AI generates your complete website" }
                  ].map((item) => (
                    <div key={item.step} className="flex items-start space-x-3 bg-gray-900/50 p-2 rounded-lg border border-gray-700/30 hover:border-blue-500/30 transition-colors group">
                      <div className="bg-blue-500/10 p-1.5 rounded-lg flex-shrink-0">
                        <span className="text-blue-400 font-mono text-xs">{item.step}</span>
                      </div>
                      <p className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pro Tips Section */}
              <div className="bg-blue-500/5 rounded-xl p-4 border border-blue-500/20 mb-4">
                <h3 className="font-semibold text-blue-400 text-sm mb-3 flex items-center space-x-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Pro Tips</span>
                </h3>
                <ul className="space-y-2">
                  {[
                    "Use shapes and text to create your layout",
                    "Add placeholder images for AI-generated replacements",
                    "Group related elements for better organization"
                  ].map((tip, index) => (
                    <li key={index} className="flex items-center space-x-2 text-sm">
                      <svg className="w-4 h-4 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-gray-400">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>


          {/* Start Button - Fixed at bottom */}
          <div className="flex-shrink-0 pt-6 mt-4 bg-gradient-to-t from-gray-900 via-gray-900/95 to-transparent">
            <button
              onClick={onClose}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium text-sm shadow-lg shadow-blue-500/25 relative group"
            >
              <div className="absolute inset-0 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-400/20 to-transparent animate-shimmer" />
              </div>
              <span className="relative">Begin Creating</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Error Fallback Component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[3000]">
      <div className="bg-red-500/10 p-6 rounded-xl border border-red-500/20 max-w-lg text-center">
        <h2 className="text-red-400 text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-gray-300 mb-4">{error.message}</p>
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export default function Home() {
  const [html, setHtml] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setHtml(null);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <main className="relative min-h-screen">
        <div className="w-screen h-screen">
          <Tldraw>
            <ExportButton setHtml={setHtml} />
            <SocialButtons />
          </Tldraw>
        </div>
        {html && (
          <PreviewPortal html={html} onClose={() => setHtml(null)} />
        )}
        {showWelcome && <WelcomeDialog onClose={() => setShowWelcome(false)} />}
      </main>
    </ErrorBoundary>
  );
}

// Extracted Components
function SocialButtons() {
  return (
    <div className="fixed bottom-[70px] left-2 flex flex-col space-y-2 md:space-y-3 z-[1000]">
      <SocialButton
        href="https://x.com/limiai"
        imgSrc="https://iili.io/2RF8uCG.png"
        alt="Button 2"
      />
    </div>
  );
}

interface SocialButtonProps {
  href: string;
  imgSrc: string;
  alt: string;
}

function SocialButton({ href, imgSrc, alt }: SocialButtonProps) {
  return (
    <button 
      className="bg-white p-1.5 md:p-2 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 group border border-gray-200/50"
      onClick={() => window.open(href, '_blank')}
    >
      <img 
        src={imgSrc}
        alt={alt}
        className="w-6 h-6 md:w-10 md:h-10 object-cover"
      />
    </button>
  );
}

interface PreviewPortalProps {
  html: string;
  onClose: () => void;
}

function PreviewPortal({ html, onClose }: PreviewPortalProps) {
  return ReactDOM.createPortal(
    <div
      className="fixed top-0 left-0 right-0 bottom-0 flex justify-center items-center"
      style={{ zIndex: 2000, backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onClose}
    >
      <AgentExecutionResult html={html} setHtml={() => onClose()} />
    </div>,
    document.body
  );
}

function ExportButton({ setHtml }: ExportButtonProps) {
  const editor = useEditor();
  const [loading, setLoading] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = (message: string) => {
    setError(message);
    setShowTerminal(false);
    setLoading(false);
    setTimeout(() => setError(null), 5000); // Clear error after 5 seconds
  };

  return (
    <>
      {error && (
        <div className="fixed top-0 left-1/2 -translate-x-1/2 mt-4 bg-gradient-to-r from-red-500/90 to-red-600/90 text-white px-4 md:px-6 py-2 md:py-3 rounded-lg shadow-2xl border border-red-500/50 backdrop-blur-md z-[5000] animate-slideDown flex items-center space-x-2 md:space-x-3 text-md md:text-base">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      )}
      <div className="fixed bottom-4 md:bottom-6 right-4 md:right-6 flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 z-[1000]">
        <button
          onClick={async (e) => {
            e.preventDefault();
            setLoading(true);
            
            try {
              const svg = await editor.getSvg(
                Array.from(editor.currentPageShapeIds)
              );
              if (!svg) {
                handleError("No content to export");
                return;
              }

              // Start showing terminal only when we begin the API call
              setShowTerminal(true);

              const png = await getSvgAsImage(svg, {
                type: "png",
                quality: 1,
                scale: 1,
              });
              const dataUrl = await blobToBase64(png!);

              // Set up timeout for API call
              const timeoutDuration = 45000; // 45 seconds
              const controller = new AbortController();
              const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

              try {
                const resp = await fetch("/api/activateAgent", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ image: dataUrl }),
                  signal: controller.signal,
                });

                clearTimeout(timeoutId);

                const json = await resp.json();

                if (json.error) {
                  handleError("Error from AI: " + JSON.stringify(json.error));
                  return;
                }

                const message = json.choices[0].message.content;
                const start = message.indexOf("<!DOCTYPE html>");
                const end = message.indexOf("</html>");
                const html = message.slice(start, end + "</html>".length);
                
                // Keep terminal visible briefly after success
                setTimeout(() => {
                  setShowTerminal(false);
                  setHtml(html);
                }, 2000);
              } catch (err) {
                if (err instanceof Error && err.name === 'AbortError') {
                  handleError("Request timed out. Please try again.");
                } else {
                  handleError("Failed to generate website. Please try again.");
                }
              }
            } catch (error) {
              console.error(error);
              handleError("An unexpected error occurred");
            } finally {
              setLoading(false);
            }
          }}
          className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium shadow-lg shadow-blue-500/25 py-2 md:py-3 px-4 md:px-6 text-md md:text-base"
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white"></div>
              <span className="hidden md:inline">Processing...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
              </svg>
              <span className="hidden md:inline">Publish</span>
            </div>
          )}
        </button>
        <button
          onClick={() => window.location.href = '/gallery'}
          className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium shadow-lg shadow-blue-500/25 py-2 md:py-3 px-4 md:px-6 text-md md:text-base"
        >
          <div className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="hidden md:inline">Liminal Gallery</span>
          </div>
        </button>
      </div>
      <PublishingTerminal 
        isVisible={showTerminal} 
        onClose={() => setShowTerminal(false)} 
      />
    </>
  );
}
