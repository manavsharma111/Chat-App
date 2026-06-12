import React, { useEffect, useState } from 'react';

const LinkPreview = ({ url, theme }) => {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchMetadata = async () => {
      const isYouTube = url.includes('youtube.com/watch') || url.includes('youtu.be/');
      let ytVideoId = null;
      if (isYouTube) {
        try {
          if (url.includes('youtu.be/')) {
            ytVideoId = url.split('youtu.be/')[1]?.split(/[?#]/)[0];
          } else {
            ytVideoId = new URL(url).searchParams.get('v');
          }
        } catch(e) {}
      }

      try {
        const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        if (data.status === 'success' && isMounted) {
          const fetchedData = data.data;
          
          if (isYouTube && ytVideoId) {
            fetchedData.image = { url: `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg` };
          }
          
          setMetadata(fetchedData);
        }
      } catch (err) {
        if (isYouTube && ytVideoId && isMounted) {
          setMetadata({
            title: "YouTube Video",
            publisher: "YouTube",
            image: { url: `https://img.youtube.com/vi/${ytVideoId}/hqdefault.jpg` }
          });
        } else {
          console.error("Error fetching link metadata:", err);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    
    fetchMetadata();
    
    return () => {
      isMounted = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className={`mt-2 flex items-center justify-center p-4 rounded-xl border ${theme === 'dark' ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'} w-full max-w-xs animate-pulse h-24`}>
        <div className="flex gap-3 w-full">
          <div className="w-16 h-16 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-full"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!metadata || (!metadata.title && !metadata.image)) {
    return null;
  }

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={`block mt-2 rounded-xl overflow-hidden border ${theme === 'dark' ? 'border-gray-600 bg-gray-700 hover:bg-gray-600' : 'border-gray-300 bg-gray-50 hover:bg-gray-100'} transition-colors w-full max-w-[320px] text-left no-underline group`}
    >
      {metadata.image?.url && (
        <div className="w-full h-36 overflow-hidden bg-gray-200 dark:bg-gray-800">
          <img 
            src={metadata.image.url} 
            alt={metadata.title || "Link preview"} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        </div>
      )}
      <div className="p-3">
        <h4 className={`text-sm font-semibold line-clamp-1 mb-1 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-800'}`}>
          {metadata.title || new URL(url).hostname}
        </h4>
        {metadata.description && (
          <p className={`text-xs line-clamp-2 mb-1.5 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
            {metadata.description}
          </p>
        )}
        <div className={`text-[10px] uppercase font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          {metadata.publisher || new URL(url).hostname.replace('www.', '')}
        </div>
      </div>
    </a>
  );
};

export default LinkPreview;
