import React, { useEffect, useState, useRef } from 'react'
import useUserStore from '../../store/useUserStore'
import { useChatStore } from '../../store/chatStore'
import { Video, Phone } from 'lucide-react'
import useThemeStore from '../../store/themeStore'
import { Send, Paperclip, X, Image as ImageIcon, Smile, File as FileIcon, Check, CheckCheck, ArrowLeft, MoreVertical, Edit2, Trash2, Lock, Music, Archive, Mic, Square, ChevronLeft, ChevronRight, CornerUpLeft, ChevronDown } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'
import { isToday, isYesterday, format } from 'date-fns'
import MessageBubble from './MessageBubble'
import { useCallStore } from '../../store/useCallStore'
import { useNavigate } from 'react-router-dom'

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

const isValidate = (date) => {
  return date instanceof Date && !isNaN(date)
}

const formatTime = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (!isValidate(date)) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const ChatWindow = ({ selectedContact, setSelectedContact, isMobile }) => {
  const [message, setMessage] = useState('')
  const [attachments, setAttachments] = useState(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showFileMenu, setShowFileMenu] = useState(false)
  const [filePreview, setFilePreview] = useState(null)
  const [showFilePreview, setShowFilePreview] = useState(false)
  const [selectedFileForPreview, setSelectedFileForPreview] = useState(null)
  const [editingMessageId, setEditingMessageId] = useState(null)
  const [replyingToMessage, setReplyingToMessage] = useState(null)
  const [hoveredMessageId, setHoveredMessageId] = useState(null)
  const [selectedMessageIds, setSelectedMessageIds] = useState([])
  const [showScrollButton, setShowScrollButton] = useState(false)

  const [isRecording, setIsRecording] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)


  const typingTimeoutRef = useRef(null)
  const imageInputRef = useRef(null)
  const documentInputRef = useRef(null)
  const audioInputRef = useRef(null)
  const zipInputRef = useRef(null)
  const messageEndRef = useRef(null)
  const chatContainerRef = useRef(null)
  const emojiPickerRef = useRef(null)
  const fileMenuRef = useRef(null)
  const emojiButtonRef = useRef(null)
  const fileButtonRef = useRef(null)
  const textareaRef = useRef(null)

  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const recordingTimerRef = useRef(null)

  const { theme, chatBackground, primaryColor } = useThemeStore()
  const { user } = useUserStore()
  const { initiateCall } = useCallStore()
  const navigate = useNavigate()

  const {
    conversations, currentConversation, messages, onlineUsers, typingUsers,
    fetchMessages, sendMessage, receiveMessage, markMessageAsRead, fetchConversations,
    startTyping, stopTyping, isUserTyping, getUserLastSeen,
    isUserOnline, deleteMessage, addReactions, editMessage
  } = useChatStore()

  const galleryImages = Array.isArray(messages) ? messages.filter(msg => msg.contentType === 'image' && msg.attachments).map(msg => msg.attachments) : []
  const [galleryIndex, setGalleryIndex] = useState(null)

  // get online status and lastseen
  const online = isUserOnline(selectedContact?._id)
  const lastSeen = getUserLastSeen(selectedContact?._id)
  const isTyping = isUserTyping(selectedContact?._id)


  useEffect(() => {
    if (selectedContact?._id && conversations?.data?.length > 0) {
      const conversation = conversations.data.find((conv) => {
        return conv.participants.some((participant) => participant?._id === selectedContact?._id)
      })

      if (conversation) {
        if (conversation._id !== currentConversation) {
          fetchMessages(conversation._id)
        }
      } else if (currentConversation !== null) {
        // If we switched to a contact with no conversation yet, clear the messages
        useChatStore.setState({ currentConversation: null, messages: [] })
      }
    }
  }, [selectedContact, conversations, currentConversation, fetchMessages])

  useEffect(() => {
    fetchConversations()
  }, [])

  const scrollToBottom = (behavior = "auto") => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior })
    }
  }

  const handleScroll = () => {
    if (!chatContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
    if (scrollHeight - scrollTop - clientHeight > 200) {
      setShowScrollButton(true);
    } else {
      setShowScrollButton(false);
    }
  };

  useEffect(() => {
    scrollToBottom("auto")
  }, [currentConversation, messages?.length])

  useEffect(() => {
    if (message && selectedContact) {
      startTyping(selectedContact?._id)
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(selectedContact?._id)
      }, 2000)
    }
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (selectedContact?._id) {
        stopTyping(selectedContact?._id)
      }
    }
  }, [message, selectedContact, startTyping, stopTyping])

  // Handle clicking outside the emoji picker or file menu to close them
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if the click is outside the emoji picker AND its toggle button
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target) &&
        emojiButtonRef.current && !emojiButtonRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
      // Check if the click is outside the file menu AND its toggle button
      if (fileMenuRef.current && !fileMenuRef.current.contains(event.target) &&
        fileButtonRef.current && !fileButtonRef.current.contains(event.target)) {
        setShowFileMenu(false)
      }
    }

    if (showEmojiPicker || showFileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker, showFileMenu])

  const handleImageClick = (imageUrl) => {
    const idx = galleryImages.findIndex(img => img === imageUrl)
    if (idx !== -1) setGalleryIndex(idx)
  }

  useEffect(() => {
    if (galleryIndex === null) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setGalleryIndex(null)
      if (e.key === 'ArrowRight') setGalleryIndex(prev => (prev + 1) % galleryImages.length)
      if (e.key === 'ArrowLeft') setGalleryIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [galleryIndex, galleryImages.length])

  // handle Attachments change
  const handleAttachmentChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setAttachments(file)
      setShowFilePreview(true)
      setSelectedFileForPreview(file)
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setFilePreview(reader.result)
        }
        reader.readAsDataURL(file)
      } else if (file.type.startsWith('video/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setFilePreview(reader.result)
        }
        reader.readAsDataURL(file)
      }
      else if (file.type.startsWith('audio/')) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setFilePreview(reader.result)
        }
        reader.readAsDataURL(file)
      }
      else {
        // Handle all other file types (pdf, zip, doc, etc.) as documents
        const reader = new FileReader()
        reader.onloadend = () => {
          setFilePreview(reader.result)
        }
        reader.readAsDataURL(file)
      }
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaRecorderRef.current = new MediaRecorder(stream)
      audioChunksRef.current = []

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data)
        }
      }

      mediaRecorderRef.current.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioFile = new File([audioBlob], `voice-record-${Date.now()}.webm`, { type: 'audio/webm' })

        setAttachments(audioFile)
        setShowFilePreview(true)
        setSelectedFileForPreview(audioFile)
        setFilePreview(URL.createObjectURL(audioBlob))

        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorderRef.current.start()
      setIsRecording(true)
      setRecordingDuration(0)

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1)
      }, 1000)
    } catch (err) {
      console.error("Error accessing microphone:", err)
      alert("Could not access microphone. Please allow permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(recordingTimerRef.current)
    }
  }

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop())
      }
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      clearInterval(recordingTimerRef.current)
      audioChunksRef.current = []
    }
  }

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // handle send or edit message
  const handleSendMessage = async () => {
    if (!selectedContact) return

    if (!message.trim() && !attachments) return

    try {
      setIsSending(true)
      if (editingMessageId) {
        await editMessage(editingMessageId, message.trim())
        setEditingMessageId(null)
      } else {
        const formData = new FormData()
        formData.append('senderId', user?._id)
        formData.append('receiverId', selectedContact?._id)

        const status = online ? "delivered" : "sent"
        formData.append("messageStatus", status)

        if (message.trim()) {
          formData.append('content', message.trim())
        }
        if (attachments) {
          formData.append("file", attachments, attachments.name)
        }
        if (replyingToMessage) {
          formData.append("replyTo", replyingToMessage._id)
        }

        await sendMessage(formData)
      }

      // clear state
      setMessage('')
      setReplyingToMessage(null)
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
      setAttachments(null)
      setSelectedFileForPreview(null)
      setShowFilePreview(false)
      setFilePreview(null)
      setShowEmojiPicker(false)

    } catch (error) {
      console.error(error)
    } finally {
      setIsSending(false)
    }
  }
  const renderDateSeperator = (date) => {
    if (!isValidate(date)) return null

    let dateString
    if (isToday(date)) {
      dateString = "Today"
    }
    else if (isYesterday(date)) {
      dateString = "Yesterday"
    }
    else {
      dateString = format(date, "EEEE MMM d")
    }
    return (
      <div className="flex justify-center my-4 w-full">
        <span className="bg-slate-800 text-white dark:bg-gray-800 px-4 py-2 rounded-full text-xs opacity-80 shadow-sm">
          {dateString}
        </span>
      </div>
    )
  }

  // Group messages by date
  const groupedMessages = Array.isArray(messages) ? messages.reduce((acc, msg) => {
    if (!msg.createdAt) return acc
    const date = new Date(msg.createdAt)
    if (isValidate(date)) {
      const dateString = format(date, "yyyy-MM-dd")
      if (!acc[dateString]) {
        acc[dateString] = []
      }
      acc[dateString].push(msg)

    }
    else {
      console.error("Invalid date format", msg)
    }
    return acc
  }, {}) : {}
  const handleReaction = (messageId, emoji) => {
    addReactions(messageId, emoji)
  }
  if (!selectedContact) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-white dark:bg-[#919191]">
        <div className="max-w-md text-center flex flex-col items-center">
          <img
            src="https://img.freepik.com/free-vector/happy-man-online-dating-via-laptop_74855-7495.jpg?semt=ais_hybrid&w=740&q=80"
            alt="Chat-App"
            className='w-full h-auto mb-4 rounded-lg'
          />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Welcome to Chat App
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-200 mt-2">
            Select a conversation to start messaging
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-200 mt-2 flex items-center justify-center">
            <Lock className="w-4 h-4 mr-2" />
            Real-time messaging with end-to-end encryption
          </p>

        </div>
      </div>
    )
  }


  const handleEditClick = (msg) => {
    setEditingMessageId(msg._id)
    setReplyingToMessage(null)
    setMessage(msg.content)
    // if attachments are there we don't support editing media, just text
    if (documentInputRef.current) documentInputRef.current.value = ''
    if (imageInputRef.current) imageInputRef.current.value = ''
    removeAttachment()
    if (textareaRef.current) textareaRef.current.focus()
  }

  const cancelEdit = () => {
    setEditingMessageId(null)
    setMessage('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleDelete = (messageId) => {
    deleteMessage(messageId)
  }

  const toggleMessageSelection = (messageId) => {
    setSelectedMessageIds(prev => {
      if (prev.includes(messageId)) {
        return prev.filter(id => id !== messageId)
      }
      return [...prev, messageId]
    })
  }

  const clearSelection = () => {
    setSelectedMessageIds([])
  }

  const handleBulkDelete = () => {
    selectedMessageIds.forEach(id => deleteMessage(id))
    clearSelection()
  }

  const handleReply = (msg) => {
    setReplyingToMessage(msg)
    if (editingMessageId) cancelEdit()
    if (textareaRef.current) textareaRef.current.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }

  const removeAttachment = () => {
    setAttachments(null);
    setFilePreview(null);
    setShowFilePreview(false);
    setSelectedFileForPreview(null);
    if (documentInputRef.current) documentInputRef.current.value = '';
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (audioInputRef.current) audioInputRef.current.value = '';
    if (zipInputRef.current) zipInputRef.current.value = '';
  }

  const handleInput = (e) => {
    setMessage(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }


  return (

    <div className="flex-1 h-full w-full max-w-full overflow-x-hidden flex flex-col neu-bg relative">
      {selectedMessageIds.length > 0 ? (
        <div className={`p-4 flex items-center justify-between neu-flat border-b border-black/5 dark:border-white/5`}>
          <div className="flex items-center">
            <button
              className='mr-4 focus:outline-none hover:opacity-70 transition-opacity cursor-pointer'
              onClick={clearSelection}
            >
              <ArrowLeft />
            </button>
            <span className="font-semibold">{selectedMessageIds.length}</span>
          </div>
          <div className="flex items-center gap-4">
            {selectedMessageIds.length === 1 && (
              <button
                onClick={() => {
                  const msg = messages.find(m => m._id === selectedMessageIds[0]);
                  if (msg) handleReply(msg);
                  clearSelection();
                }}
                className="hover:opacity-70 transition-opacity p-2"
                title="Reply"
              >
                <CornerUpLeft size={20} />
              </button>
            )}
            {selectedMessageIds.length === 1 && messages.find(m => m._id === selectedMessageIds[0])?.sender?._id === user?._id && (
              <button
                onClick={() => {
                  const msg = messages.find(m => m._id === selectedMessageIds[0]);
                  if (msg) handleEditClick(msg);
                  clearSelection();
                }}
                className="hover:opacity-70 transition-opacity p-2"
                title="Edit"
              >
                <Edit2 size={20} />
              </button>
            )}
            <button
              onClick={handleBulkDelete}
              className="hover:opacity-70 transition-opacity p-2"
              title="Delete"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      ) : (
        <div className={`p-4 flex items-center justify-between neu-flat border-b border-black/5 dark:border-white/5`}>
          <button
            className='mr-4 focus:outline-none hover:opacity-70 transition-opacity cursor-pointer'
            onClick={() => setSelectedContact(null)}
          >
            <ArrowLeft />
          </button>
          {selectedContact?.profilePicture ? (
            <img src={selectedContact.profilePicture}
              alt={selectedContact?.username}
              className="w-10 h-10 rounded-full object-cover mr-3 border border-gray-200 dark:border-gray-700" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white font-semibold mr-3 shadow-sm">
              {selectedContact?.username?.charAt(0).toUpperCase() || '?'}
            </div>
          )}
          <div className="ml-3 grow ">
            <h2 className="font-semibold text-start ">
              {selectedContact?.username}
            </h2>
            {
              isTyping ? (
                <div className={`text-xs italic ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  {selectedContact.username} is typing...
                </div>
              ) : (
                <p className={`text-xs ${online ? 'text-green-500' : 'text-gray-700'}`} >{online ? "Online" : "Offline"} </p>
              )
            }

          </div>

          <div className="flex items-center space-x-4 mr-4">
            <button
              className="focus:outline-none hover:opacity-70 hover:bg-black/5 rounded-full p-2 transition-all cursor-pointer"
              style={{ color: primaryColor }}
              title="Video Call"
              onClick={() => {
                const roomId = currentConversation || `room-${user._id}-${selectedContact._id}`
                initiateCall({
                  roomId,
                  callType: 'video',
                  receiverIds: [selectedContact._id],
                  callerInfo: { _id: user._id, username: user.username, profilePicture: user.profilePicture }
                })
                navigate(`/call/${roomId}`)
              }}
            >
              <Video size={22} strokeWidth={2} className="text-current" />
            </button>
            <button
              className="focus:outline-none hover:opacity-70 hover:bg-black/5 rounded-full p-2 transition-all cursor-pointer"
              style={{ color: primaryColor }}
              title="Audio Call"
              onClick={() => {
                const roomId = currentConversation || `room-${user._id}-${selectedContact._id}`
                initiateCall({
                  roomId,
                  callType: 'audio',
                  receiverIds: [selectedContact._id],
                  callerInfo: { _id: user._id, username: user.username, profilePicture: user.profilePicture }
                })
                navigate(`/call/${roomId}`)
              }}
            >
              <Phone size={22} strokeWidth={2} className="text-current" />
            </button>
          </div>
        </div>
      )}

      <div
        ref={chatContainerRef}
        onScroll={handleScroll}
        className={`flex-1 p-4 overflow-auto ${(!chatBackground || chatBackground === 'default') ? (theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-rose-200 text-gray-900 shadow-sm') : (theme === 'dark' ? 'text-white' : 'text-gray-900')}`}
        style={
          chatBackground && chatBackground !== 'default'
            ? chatBackground.startsWith('#')
              ? { backgroundColor: chatBackground }
              : { backgroundImage: `url(${chatBackground})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' }
            : {}
        }
      >
        {Object.entries(groupedMessages).map(([date, messages]) => (
          <React.Fragment key={date}>
            {renderDateSeperator(new Date(date))}
            {messages.map((msg) => (
              <MessageBubble
                key={msg._id || msg.tempId}
                message={msg}
                theme={theme}
                senderId={user?._id}
                onReact={handleReaction}
                onEdit={handleEditClick}
                onDelete={handleDelete}
                onReply={handleReply}
                isEditing={editingMessageId === msg._id}
                onCancelEdit={cancelEdit}
                isSelected={selectedMessageIds.includes(msg._id)}
                selectionMode={selectedMessageIds.length > 0}
                onSelectMessage={toggleMessageSelection}
                onImageClick={handleImageClick}
              />
            ))}
          </React.Fragment>
        ))}
        <div ref={messageEndRef} className="pb-4" />
      </div>

      {/* Scroll to bottom FAB */}
      {showScrollButton && (
        <div className="absolute bottom-24 right-8 z-40">
          <button
            onClick={() => scrollToBottom("smooth")}
            className={`p-3 rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 ${theme === 'dark' ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}
          >
            <ChevronDown size={24} />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className={`mobile-chat-input-wrapper p-4 pt-2 pb-6 flex flex-col neu-bg ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>

        {/* Edit / Reply Banner */}
        {(editingMessageId || replyingToMessage) && (
          <div
            className={`mb-3 flex items-center justify-between p-3 rounded-lg border-l-4 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'}`}
            style={{ borderColor: primaryColor }}
          >
            <div className="flex flex-col overflow-hidden pr-4">
              <span
                className="text-xs font-semibold"
                style={{ color: primaryColor }}
              >
                {editingMessageId ? 'Edit Message' : `Replying to ${replyingToMessage?.sender?.username || 'user'}`}
              </span>
              <span className="text-sm truncate text-gray-600 dark:text-gray-300 mt-0.5">
                {editingMessageId
                  ? messages.find(m => m._id === editingMessageId)?.content || '...'
                  : (replyingToMessage?.contentType === 'text' ? replyingToMessage?.content : replyingToMessage?.contentType || 'Media Message')}
              </span>
            </div>
            <button
              onClick={() => {
                if (editingMessageId) cancelEdit();
                if (replyingToMessage) setReplyingToMessage(null);
              }}
              className="p-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {showFilePreview && filePreview && (
          <div className="mb-2 relative inline-block">
            {attachments?.type?.startsWith('image/') ? (
              <img src={filePreview} alt="Preview" className="h-20 rounded" />
            ) : attachments?.type?.startsWith('video/') ? (
              <video src={filePreview} className="h-20 rounded" />
            ) : attachments?.type?.startsWith('audio/') ? (
              <audio src={filePreview} controls className="h-12 w-[250px]" />
            ) : (
              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 p-2 rounded">
                <FileIcon size={24} />
                <span className="text-sm truncate max-w-xs">{attachments?.name}</span>
              </div>
            )}
            <button onClick={removeAttachment} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-sm">
              <X size={14} />
            </button>
          </div>
        )}

        {isRecording ? (
          <div className="flex items-center justify-between w-full p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
            <div className="flex items-center gap-3 pl-3">
              <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-500 font-mono font-medium">{formatDuration(recordingDuration)}</span>
            </div>
            <div className="flex items-center gap-2 pr-1">
              <button onClick={cancelRecording} className="p-2 text-gray-500 hover:text-red-500 transition-colors">
                <Trash2 size={20} />
              </button>
              <button onClick={stopRecording} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-sm transition-colors">
                <Square size={16} fill="currentColor" />
              </button>
            </div>
          </div>
        ) : (
          <div className="relative flex items-center" ref={emojiPickerRef}>

            <button
              ref={emojiButtonRef}
              onClick={() => setShowEmojiPicker(prev => !prev)}
              className="mobile-chat-btn-small p-2 rounded-full text-gray-500 hover:bg-rose-100 group transition-all cursor-pointer"
            >
              <Smile
                size={24}
                className="transition-colors duration-200 group-hover:text-rose-500"
              />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-12 left-0 z-50" ref={emojiPickerRef}>
                <EmojiPicker
                  onEmojiClick={(e) => setMessage(prev => prev + e.emoji)}
                  theme={theme}
                  height={isMobile ? 320 : 350}
                  width={isMobile ? 300 : 450}
                />
              </div>
            )}

            {showFileMenu &&
              <div
                className={`absolute bottom-16 left-2 z-50 p-2 rounded-2xl flex flex-col w-56 animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300 ${theme === 'dark' ? 'bg-gray-900/80 backdrop-blur-xl border border-gray-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.5)]' : 'bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.12)]'}`}
                ref={fileMenuRef}
              >
                <input
                  type="file"
                  ref={documentInputRef}
                  className="hidden"
                  onChange={(e) => {
                    handleAttachmentChange(e);
                    setShowFileMenu(false);
                  }}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" />

                <input
                  type="file"
                  ref={imageInputRef}
                  className="hidden"
                  onChange={(e) => {
                    handleAttachmentChange(e);
                    setShowFileMenu(false);
                  }}
                  accept="image/*,video/*" />

                <input
                  type="file"
                  ref={audioInputRef}
                  className="hidden"
                  onChange={(e) => {
                    handleAttachmentChange(e);
                    setShowFileMenu(false);
                  }}
                  accept="audio/*" />

                <input
                  type="file"
                  ref={zipInputRef}
                  className="hidden"
                  onChange={(e) => {
                    handleAttachmentChange(e);
                    setShowFileMenu(false);
                  }}
                  accept=".zip,.rar,.7z" />

                <button
                  onClick={() => documentInputRef.current?.click()}
                  className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 cursor-pointer ${theme === 'dark' ? 'hover:bg-gray-800/80 text-gray-200' : 'hover:bg-white text-gray-700 hover:shadow-sm'}`}
                >
                  <div className="bg-linear-to-tr from-violet-500 to-fuchsia-500 p-2.5 rounded-[14px] text-white shadow-lg shadow-violet-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 cursor-pointer ">
                    <FileIcon size={20} strokeWidth={2.5} />
                  </div>
                  <span className="font-semibold text-[15px] tracking-wide">Document</span>
                </button>

                <button
                  onClick={() => audioInputRef.current?.click()}
                  className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 cursor-pointer ${theme === 'dark' ? 'hover:bg-gray-800/80 text-gray-200' : 'hover:bg-white text-gray-700 hover:shadow-sm'}`}
                >
                  <div className="bg-linear-to-tr from-rose-500 to-pink-500 p-2.5 rounded-[14px] text-white shadow-lg shadow-rose-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 cursor-pointer ">
                    <Music size={20} strokeWidth={2.5} />
                  </div>
                  <span className="font-semibold text-[15px] tracking-wide">Audio</span>
                </button>

                <button
                  onClick={() => zipInputRef.current?.click()}
                  className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 cursor-pointer ${theme === 'dark' ? 'hover:bg-gray-800/80 text-gray-200' : 'hover:bg-white text-gray-700 hover:shadow-sm'}`}
                >
                  <div className="bg-linear-to-tr from-amber-500 to-orange-500 p-2.5 rounded-[14px] text-white shadow-lg shadow-amber-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 cursor-pointer ">
                    <Archive size={20} strokeWidth={2.5} />
                  </div>
                  <span className="font-semibold text-[15px] tracking-wide">Zip / Archive</span>
                </button>

                <button
                  onClick={() => imageInputRef.current?.click()}
                  className={`group flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300  ${theme === 'dark' ? 'hover:bg-gray-800/80 text-gray-200' : 'hover:bg-white text-gray-700 hover:shadow-sm'}`}
                >
                  <div className="bg-linear-to-tr from-cyan-500 to-blue-500 p-2.5 rounded-[14px] text-white shadow-lg shadow-blue-500/30 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3 ">
                    <ImageIcon size={20} strokeWidth={2.5} />
                  </div>
                  <span className="font-semibold cursor-pointer text-[15px] tracking-wide">Photos & Videos</span>
                </button>
              </div>
            }

            <button
              ref={fileButtonRef}
              onClick={() => setShowFileMenu(!showFileMenu)}
              className="mobile-chat-btn-small p-2 rounded-full text-gray-500 hover:bg-blue-100 group transition-all cursor-pointer"
            >
              <Paperclip
                size={24}
                className="transition-colors duration-200 group-hover:text-blue-500"
              />
            </button>

            <textarea
              ref={textareaRef}
              value={message}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              rows={1}
              className={`flex-1 min-w-0 grow mx-2 p-3 rounded-2xl focus:outline-none resize-none overflow-y-auto ${theme === 'dark' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-900'}`}
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />


            {message.trim() || attachments ? (
              <button
                onClick={handleSendMessage}
                disabled={isSending}
                className="mobile-chat-btn-large p-3 ml-2 rounded-full neu-flat flex items-center justify-center hover:scale-105 active:neu-pressed transition-all shrink-0"
                style={{ color: primaryColor }}
              >
                <Send size={20} />
              </button>
            ) : (
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className="mobile-chat-btn-large p-3 ml-2 rounded-full neu-flat flex items-center justify-center hover:scale-105 active:neu-pressed transition-all shrink-0"
                style={{ color: primaryColor }}
              >
                <Mic size={20} />
              </button>
            )}
          </div>
        )}
      </div>

      {galleryIndex !== null && galleryImages.length > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 select-none" onClick={() => setGalleryIndex(null)}>
          <button onClick={(e) => { e.stopPropagation(); setGalleryIndex(null); }} className="absolute top-4 right-6 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-[101]">
            <X size={32} />
          </button>

          <button onClick={(e) => { e.stopPropagation(); setGalleryIndex(prev => (prev - 1 + galleryImages.length) % galleryImages.length); }} className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-[101]">
            <ChevronLeft size={48} />
          </button>

          <img src={galleryImages[galleryIndex]} alt="Gallery" className="max-w-full max-h-[90vh] object-contain cursor-pointer" onClick={(e) => e.stopPropagation()} />

          <button onClick={(e) => { e.stopPropagation(); setGalleryIndex(prev => (prev + 1) % galleryImages.length); }} className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-[101]">
            <ChevronRight size={48} />
          </button>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-black/50 px-4 py-1.5 rounded-full">
            {galleryIndex + 1} / {galleryImages.length}
          </div>
        </div>
      )}
    </div>
  )
}

export default ChatWindow