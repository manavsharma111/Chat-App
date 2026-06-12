import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Heart, Send, ChevronUp, Eye, Smile } from 'lucide-react';
import EmojiPicker from 'emoji-picker-react';
import useThemeStore from '../../store/themeStore';
import { useStatusStore } from '../../store/useStatusStore';
import useUserStore from '../../store/useUserStore';
import { useChatStore } from '../../store/chatStore';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';

const StatusViewer = ({ userStatuses, onClose, isMyStatus }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [replyText, setReplyText] = useState("");
  const [showInsights, setShowInsights] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [activeTab, setActiveTab] = useState('views'); // 'views' or 'likes'

  const { theme, primaryColor } = useThemeStore();
  const { user } = useUserStore();
  const { viewStatus, deleteStatus, toggleLikeStatus } = useStatusStore();
  const { sendMessage } = useChatStore();
  
  const currentStatus = userStatuses[currentIndex];
  const isVideo = currentStatus?.attachments?.[0]?.fileType === 'video';
  const videoRef = useRef(null);

  // Check if current user has liked this status
  const hasLiked = currentStatus?.likes?.some(v => v._id === user._id || v === user._id);

  useEffect(() => {
    if (!currentStatus) return;
    
    // Mark as viewed
    if (!isMyStatus && !currentStatus.viewers?.some(v => v._id === user._id || v === user._id)) {
      viewStatus(currentStatus._id);
    }

    setProgress(0);
    let duration = 5000; // default 5 seconds for images
    let interval;

    // Pause progression if insights are open, or if user is typing/picking emojis
    const isPaused = showInsights || showEmojiPicker || isInputFocused;
    if (!isVideo && !isPaused) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            handleNext();
            return 100;
          }
          return prev + (100 / (duration / 50)); // update every 50ms
        });
      }, 50);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentIndex, currentStatus, showInsights, showEmojiPicker, isInputFocused]);

  // Handle video pause/play when insights open
  useEffect(() => {
    if (videoRef.current) {
      const isPaused = showInsights || showEmojiPicker || isInputFocused;
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => console.log("Play interrupted", e));
      }
    }
  }, [showInsights, showEmojiPicker, isInputFocused]);

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && !showInsights) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(p);
    }
  };

  const handleVideoEnded = () => {
    if (!showInsights) handleNext();
  };

  const handleNext = () => {
    if (currentIndex < userStatuses.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      setProgress(0);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if(window.confirm("Delete this status update?")) {
      await deleteStatus(currentStatus._id);
      if (userStatuses.length <= 1) {
        onClose();
      } else {
        if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
      }
    }
  };

  const handleLike = (e) => {
    e.stopPropagation();
    toggleLikeStatus(currentStatus._id);
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!replyText.trim()) return;

    try {
      const formData = new FormData();
      formData.append("senderId", user._id);
      formData.append("receiverId", currentStatus.user._id);
      formData.append("content", `💬 Replying to your status:\n\n${replyText.trim()}`);

      await sendMessage(formData);
      toast.success("Reply sent!");
      setReplyText("");
    } catch (err) {
      toast.error("Failed to send reply");
    }
  };

  if (!currentStatus) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed inset-0 z-[999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      >
        <div className="relative w-full max-w-md h-full sm:h-[85vh] sm:rounded-3xl overflow-hidden bg-black flex flex-col">
          
          {/* Progress Bars */}
          <div className="absolute top-0 left-0 w-full flex gap-1 p-3 z-20">
            {userStatuses.map((_, idx) => (
              <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white transition-all duration-75"
                  style={{ 
                    width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
                  }}
                />
              </div>
            ))}
          </div>

          {/* Header */}
          <div className="absolute top-6 left-0 w-full flex items-center justify-between p-4 z-20 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center gap-3">
              <img 
                src={currentStatus.user.profilePicture || `https://ui-avatars.com/api/?name=${currentStatus.user.username}`} 
                alt="Profile" 
                className="w-10 h-10 rounded-full border border-white/20"
              />
              <div>
                <h3 className="text-white font-semibold text-sm">{isMyStatus ? 'My Status' : currentStatus.user.username}</h3>
                <p className="text-white/70 text-xs">
                  {formatDistanceToNow(new Date(currentStatus.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {isMyStatus && (
                <button onClick={handleDelete} className="text-white hover:text-red-400 p-2">
                  <Trash2 size={20} />
                </button>
              )}
              <button onClick={onClose} className="text-white hover:bg-white/20 p-2 rounded-full transition-colors">
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 relative flex items-center justify-center bg-black">
            {isVideo ? (
              <video 
                ref={videoRef}
                src={currentStatus.attachments?.[0]?.url || currentStatus.content}
                autoPlay 
                playsInline
                onTimeUpdate={handleVideoTimeUpdate}
                onEnded={handleVideoEnded}
                className="w-full h-full object-contain"
              />
            ) : currentStatus.attachments?.[0]?.fileType === 'image' || currentStatus.attachments?.[0]?.url ? (
              <img 
                src={currentStatus.attachments?.[0]?.url || currentStatus.content}
                alt="Status"
                className="w-full h-full object-contain"
              />
            ) : (
              <div 
                className="w-full h-full flex items-center justify-center p-8 text-center"
                style={{ background: `linear-gradient(135deg, ${primaryColor}, #1e3a8a)` }}
              >
                <p className="text-white text-2xl font-medium whitespace-pre-wrap break-words">
                  {currentStatus.content}
                </p>
              </div>
            )}
            
            {/* Navigation Click Areas (Disabled if insights are open) */}
            {!showInsights && (
              <>
                <div className="absolute inset-y-0 left-0 w-1/3 z-10 cursor-pointer" onClick={handlePrev} />
                <div className="absolute inset-y-0 right-0 w-2/3 z-10 cursor-pointer" onClick={handleNext} />
              </>
            )}
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 w-full z-20 p-4 bg-gradient-to-t from-black/80 to-transparent">
            {isMyStatus ? (
              // Insights Trigger for My Status
              <div className="flex justify-center">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowInsights(true); }}
                  className="flex flex-col items-center gap-1 text-white hover:bg-white/10 p-2 px-6 rounded-2xl transition-colors"
                >
                  <ChevronUp size={20} className="animate-bounce" />
                  <div className="flex items-center gap-3 text-sm font-medium">
                    <span className="flex items-center gap-1"><Eye size={16}/> {currentStatus.viewers?.length || 0}</span>
                    <span className="flex items-center gap-1"><Heart size={16}/> {currentStatus.likes?.length || 0}</span>
                  </div>
                </button>
              </div>
            ) : (
              // Reply & Like for Other's Status
              <div className="w-full flex flex-col gap-2">
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 20 }}
                      className="self-start mb-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EmojiPicker 
                        onEmojiClick={(emojiObject) => setReplyText(prev => prev + emojiObject.emoji)}
                        theme={theme === 'dark' ? 'dark' : 'light'}
                        height={350}
                        width={300}
                        searchDisabled
                        skinTonesDisabled
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
                <form onSubmit={handleReplySubmit} className="flex items-center gap-3 w-full">
                  <div className="flex-1 flex items-center bg-white/20 border border-white/30 rounded-full px-2 py-1 backdrop-blur-sm focus-within:bg-white/30 transition-all text-white">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(!showEmojiPicker); }}
                      className="p-2 text-white/70 hover:text-white transition-colors"
                    >
                      <Smile size={20} />
                    </button>
                    <input 
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Reply to status..."
                      className="flex-1 bg-transparent placeholder-white/70 text-sm px-2 py-2 outline-none"
                      onClick={(e) => { e.stopPropagation(); setShowEmojiPicker(false); }}
                      onFocus={() => setIsInputFocused(true)}
                      onBlur={() => setIsInputFocused(false)}
                    />
                  </div>
                  {replyText ? (
                    <button type="submit" className="text-white bg-blue-500 p-3 rounded-full hover:bg-blue-600 transition-colors shrink-0">
                      <Send size={20} />
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); handleLike(e); setShowEmojiPicker(false); }}
                      className="p-3 rounded-full hover:bg-white/20 transition-colors shrink-0"
                    >
                      <Heart 
                        size={28} 
                        className={hasLiked ? "text-red-500 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]" : "text-white"} 
                        fill={hasLiked ? "currentColor" : "none"} 
                      />
                    </button>
                  )}
                </form>
              </div>
            )}
          </div>

          {/* Insights Bottom Sheet Modal */}
          <AnimatePresence>
            {showInsights && (
              <motion.div 
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="absolute bottom-0 left-0 w-full h-[70%] bg-gray-900 rounded-t-3xl z-30 flex flex-col shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
              >
                <div className="p-4 border-b border-gray-800 flex items-center justify-between">
                  <div className="flex gap-4">
                    <button 
                      className={`text-sm font-semibold flex items-center gap-2 pb-1 ${activeTab === 'views' ? 'text-white border-b-2 border-white' : 'text-gray-400'}`}
                      onClick={() => setActiveTab('views')}
                    >
                      <Eye size={18} /> {currentStatus.viewers?.length || 0} Views
                    </button>
                    <button 
                      className={`text-sm font-semibold flex items-center gap-2 pb-1 ${activeTab === 'likes' ? 'text-red-500 border-b-2 border-red-500' : 'text-gray-400'}`}
                      onClick={() => setActiveTab('likes')}
                    >
                      <Heart size={18} fill={activeTab === 'likes' ? "currentColor" : "none"} /> {currentStatus.likes?.length || 0} Likes
                    </button>
                  </div>
                  <button onClick={() => setShowInsights(false)} className="text-gray-400 hover:text-white p-2 bg-gray-800 rounded-full">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {activeTab === 'views' ? (
                    currentStatus.viewers?.length > 0 ? currentStatus.viewers.map((viewer, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <img src={viewer.profilePicture || `https://ui-avatars.com/api/?name=${viewer.username}`} className="w-12 h-12 rounded-full border border-gray-700" />
                        <div>
                          <h4 className="text-white font-medium text-sm">{viewer.username}</h4>
                          <p className="text-gray-500 text-xs">Viewed</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-center text-gray-500 text-sm mt-10">No views yet</p>
                    )
                  ) : (
                    currentStatus.likes?.length > 0 ? currentStatus.likes.map((liker, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <img src={liker.profilePicture || `https://ui-avatars.com/api/?name=${liker.username}`} className="w-12 h-12 rounded-full border border-gray-700" />
                        <div>
                          <h4 className="text-white font-medium text-sm">{liker.username}</h4>
                          <p className="text-red-400 text-xs flex items-center gap-1"><Heart size={10} fill="currentColor"/> Liked</p>
                        </div>
                      </div>
                    )) : (
                      <p className="text-center text-gray-500 text-sm mt-10">No likes yet</p>
                    )
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default StatusViewer;
