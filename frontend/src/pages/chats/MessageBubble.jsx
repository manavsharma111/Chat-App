import React, { useState, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import { Check, CheckCheck, Smile, CornerUpLeft, Edit2, Trash2, File, Plus, ChevronDown } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import LinkPreview from './LinkPreview'
import useThemeStore from '../../store/themeStore'

const urlRegex = /(https?:\/\/[^\s]+)/g;

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

const MessageBubble = ({
  message,
  senderId,
  onReact,
  onEdit,
  onDelete, 
  onReply,
  isEditing,
  onCancelEdit,
  isSelected,
  selectionMode,
  onSelectMessage,
  onImageClick,
  theme
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showReactions, setShowReactions] = useState(false)
  const messageRef = useRef(null)
  const optionRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const reactionRef = useRef(null)
  const isMe = message?.sender?._id === senderId || message?.sender === senderId
  const { primaryColor } = useThemeStore()
  
  // Format the time safely
  const time = message?.createdAt ? format(new Date(message.createdAt), 'h:mm a') : ''

  const handleQuickReact = (emoji) => {
    onReact(message._id, emoji)
    setShowReactions(false)
  }

  const longPressTimerRef = useRef(null)

  const handleTouchStart = (e) => {
    if (e.touches && e.touches.length > 1) return;
    longPressTimerRef.current = setTimeout(() => {
      onSelectMessage(message._id);
      setShowReactions(true);
      if (window.navigator && window.navigator.vibrate) {
        window.navigator.vibrate(50);
      }
    }, 500);
  }

  const handleTouchEndOrMove = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }
  }

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (messageRef.current && !messageRef.current.contains(event.target)) {
        setShowReactions(false)
        setShowEmojiPicker(false)
      }
    }

    if (showReactions || showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showReactions, showEmojiPicker])

  return (
    <div 
      id={`message-${message._id}`} 
      ref={messageRef}
      className={`chat ${isMe ? 'chat-end' : 'chat-start'} mb-4 group relative px-2 py-1 rounded-lg transition-colors max-w-full w-full ${isSelected ? (theme === 'dark' ? 'bg-blue-900/40' : 'bg-blue-100/60') : 'hover:bg-black/5 dark:hover:bg-white/5'}`}
      onClick={(e) => {
        if (selectionMode) {
          e.stopPropagation();
          onSelectMessage(message._id);
        }
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEndOrMove}
      onTouchMove={handleTouchEndOrMove}
      onContextMenu={(e) => {
        e.preventDefault();
        if (!selectionMode) {
          onSelectMessage(message._id);
          setShowReactions(true);
        }
      }}
    >
      <div className="chat-image avatar">
        <div className="w-10 rounded-full border border-gray-200 dark:border-gray-700">
          <img 
            alt="User avatar" 
            src={message?.sender?.profilePicture || "https://img.freepik.com/free-vector/happy-man-online-dating-via-laptop_74855-7495.jpg?semt=ais_hybrid&w=740&q=80"} 
          />
        </div>
      </div>
      <div className="chat-header mb-1 flex items-center gap-1 max-w-full min-w-0 overflow-hidden">
        <span className="truncate">{message?.sender?.username || 'User'}</span>
        <time className="text-xs opacity-50 ml-1 shrink-0">{time}</time>
      </div>
      <div 
        className={`before:hidden rounded-2xl relative flex flex-col min-h-10 px-3 py-2 shadow-sm border max-w-full min-w-0 break-words ${isMe ? 'text-white border-transparent' : 'bg-white dark:bg-[#1e293b] text-gray-800 dark:text-gray-100 border-gray-100 dark:border-gray-800'}`}
        style={isMe ? { backgroundColor: primaryColor } : {}}
      >
        
        {/* Replied Message Block */}
        {message?.replyTo && (
          <div 
            onClick={() => {
              const target = document.getElementById(`message-${message.replyTo._id || message.replyTo}`);
              if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Add a subtle flash effect without hardcoding background colors
                target.classList.add('opacity-50', 'scale-[0.98]', 'transition-all', 'duration-300');
                setTimeout(() => {
                  target.classList.remove('opacity-50', 'scale-[0.98]');
                }, 800);
              }
            }}
            className={`mb-2 px-3 py-2 rounded-xl text-sm border-l-[4px] cursor-pointer transition-colors ${
              isMe 
                ? 'bg-black/10 hover:bg-black/20 border-white/60' 
                : 'bg-gray-100/80 dark:bg-gray-700/80 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            style={!isMe ? { borderColor: primaryColor } : {}}
          >
            <div 
              className={`font-bold text-xs mb-0.5 ${isMe ? 'text-white' : ''}`}
              style={!isMe ? { color: primaryColor } : {}}
            >
              {message.replyTo.sender?.username || 'user'}
            </div>
            <div className={`truncate max-w-[220px] text-[13px] leading-tight ${isMe ? 'text-white/80' : 'text-gray-600 dark:text-gray-300'}`}>
              {message.replyTo.contentType === 'text' ? message.replyTo.content 
                : message.replyTo.contentType === 'image' ? '📷 Photo'
                : message.replyTo.contentType === 'audio' ? '🎵 Audio'
                : message.replyTo.contentType === 'video' ? '🎥 Video'
                : '📎 Document'
              }
            </div>
          </div>
        )}
        
        {/* Media Content */}
        {message?.attachments && message?.contentType === 'image' && (
          <img 
            src={message.attachments} 
            alt="Media" 
            onClick={(e) => {
              e.stopPropagation();
              if(onImageClick) onImageClick(message.attachments);
            }}
            className={`rounded-lg w-full max-w-[70vw] sm:max-w-[320px] h-auto max-h-[350px] object-cover cursor-pointer hover:opacity-95 transition-opacity ${message?.content ? 'mb-2' : ''}`} 
          />
        )}
        {message?.attachments && message?.contentType === 'video' && (
          <video 
            src={message.attachments} 
            controls 
            className={`rounded-lg w-full max-w-[70vw] sm:max-w-[320px] max-h-[350px] bg-black/5 dark:bg-black/20 ${message?.content ? 'mb-2' : ''}`} 
          />
        )}
        {message?.attachments && message?.contentType === 'audio' && (
          <audio src={message.attachments} controls className={`w-[220px] sm:w-[280px] max-w-[70vw] h-12 ${message?.content ? 'mb-2' : ''}`} />
        )}
        {message?.attachments && !['image', 'video', 'audio'].includes(message?.contentType) && (
          <a href={message.attachments} target="_blank" rel="noreferrer" className="flex items-center gap-2 bg-black/10 dark:bg-white/10 p-2 rounded-lg mb-2 hover:bg-black/20 dark:hover:bg-white/20 transition-colors">
            <File size={20} />
            <span className="text-sm font-medium underline text-blue-100">Document File</span>
          </a>
        )}
        
        {/* Text Content */}
        {message?.content && (
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content.split(urlRegex).map((part, i) => {
              if (part.match(urlRegex)) {
                return <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="underline text-blue-200 hover:text-blue-100" onClick={e => e.stopPropagation()}>{part}</a>;
              }
              return <span key={i}>{part}</span>;
            })}
          </p>
        )}

        {/* Link Previews */}
        {message?.content && (
          message.content.match(urlRegex)?.slice(0, 1).map((url, i) => (
            <LinkPreview key={i} url={url} theme={theme} />
          ))
        )}

        {/* Reactions Display */}
        {message?.reactions?.length > 0 && (
          <div className={`absolute -bottom-3 ${isMe ? 'right-2' : 'left-2'} bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-sm border border-gray-200 dark:border-gray-600 rounded-full px-1.5 py-0.5 flex items-center gap-1 z-10`}>
            {Object.entries(message.reactions.reduce((acc, r) => {
              acc[r.emoji] = (acc[r.emoji] || 0) + 1;
              return acc;
            }, {})).map(([emoji, count]) => (
              <span key={emoji} className="flex items-center gap-0.5">
                <span className="text-[14px] leading-none">{emoji}</span>
                {count > 1 && <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium ml-0.5">{count}</span>}
              </span>
            ))}
          </div>
        )}

        {/* Reaction Picker Popup */}
        {showReactions && (
          <div className={`absolute top-0 -translate-y-full mb-2 ${isMe ? 'right-0' : 'left-0'} z-20 flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-2`}>
            <div className="bg-white dark:bg-gray-800 shadow-lg rounded-full px-3 py-2 border border-gray-100 dark:border-gray-700 flex items-center gap-2">
              {QUICK_REACTIONS.map(emoji => (
                <button 
                  key={emoji} 
                  onClick={(e) => { e.stopPropagation(); handleQuickReact(emoji); }} 
                  className="hover:scale-125 transition-transform text-xl focus:outline-none"
                >
                  {emoji}
                </button>
              ))}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEmojiPicker(!showEmojiPicker);
                }}
                className="hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-full transition-colors focus:outline-none text-gray-500 flex items-center justify-center bg-gray-50 dark:bg-gray-700"
              >
                <Plus size={16} />
              </button>
            </div>
            
            {showEmojiPicker && (
              <div className="shadow-2xl rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                <EmojiPicker 
                  onEmojiClick={(emojiObj) => {
                    handleQuickReact(emojiObj.emoji);
                    setShowEmojiPicker(false);
                  }}
                  theme={theme === 'dark' ? 'dark' : 'light'}
                  width={320}
                  height={380}
                  lazyLoadEmojis={true}
                  searchDisabled={false}
                  skinTonesDisabled={false}
                />
              </div>
            )}
          </div>
        )}


      </div>

      <div className="chat-footer opacity-50 flex items-center gap-1 mt-1">
        {isMe && (
          <span className={`${message?.messageStatus === 'read' ? 'text-blue-500' : 'text-gray-400'}`}>
            {message?.messageStatus === 'read' ? <CheckCheck size={14} /> : 
              message?.messageStatus === 'delivered' ? <CheckCheck size={14} /> : 
              <Check size={14} />}
          </span>
        )}
        {message?.isEdited && <span className="text-[10px] ml-1">Edited</span>}
      </div>
    </div>
  )
}

export default MessageBubble