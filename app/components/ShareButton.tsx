import { useState } from 'react';
import { useEditor } from "@tldraw/tldraw";
import { blobToBase64 } from "@/lib/blobToBase64";
import { getSvgAsImage } from "@/lib/getSvgAsImage";

export function ShareButton() {
  const editor = useEditor();
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  const handleShare = async () => {
    setIsLoading(true);
    try {
      const svg = await editor.getSvg(Array.from(editor.currentPageShapeIds));
      if (!svg) {
        throw new Error("No content to share");
      }

      const png = await getSvgAsImage(svg, {
        type: "png",
        quality: 1,
        scale: 1,
      });
      
      const dataUrl = await blobToBase64(png!);
      
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: dataUrl }),
      });

      const { shareId } = await response.json();
      const shareUrl = `${window.location.origin}/share/${shareId}`;
      
      await navigator.clipboard.writeText(shareUrl);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error('Failed to share design:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleShare}
        className="bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl hover:from-purple-700 hover:to-purple-600 transition-all duration-200 transform hover:scale-[1.02] focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 font-medium shadow-lg shadow-purple-500/25 py-2 md:py-3 px-4 md:px-6 text-md md:text-base flex items-center space-x-2"
        disabled={isLoading}
      >
        {isLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white"></div>
            <span>Sharing...</span>
          </div>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share Design</span>
          </>
        )}
      </button>
      
      {showToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50 animate-slideDown">
          Share link copied to clipboard!
        </div>
      )}
    </>
  );
} 