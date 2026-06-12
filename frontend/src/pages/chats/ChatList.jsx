import React, { useState } from 'react'
import useUserStore from '../../store/useUserStore'
import useThemeStore from '../../store/themeStore'
import useLayoutStore from '../../store/layoutStore'
import { useChatStore } from '../../store/chatStore'
import { Plus, Search, MessageSquare } from 'lucide-react'
import { motion } from 'framer-motion'
import NewChatModal from './NewChatModal'

const formatTimestamp = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const ChatList = ({ contacts }) => {
  const setSelectedContact = useLayoutStore(state => state.setSelectedContact)
  const selectedContact = useLayoutStore(state => state.selectedContact)
  const { theme } = useThemeStore()
  const { user } = useUserStore()
  
  // Get live states from chatStore
  const conversations = useChatStore(state => state.conversations)
  const isUserOnline = useChatStore(state => state.isUserOnline)
  
  const [searchTerms, setSearchTerms] = useState('')
  const [showNewChat, setShowNewChat] = useState(false)
  const filteredContacts = contacts?.filter(contact =>
    contact?.username?.toLowerCase().includes(searchTerms.toLowerCase())
  )

  return (
    <>
    <div className={`flex flex-col h-screen border-r border-black/5 dark:border-white/5 shrink-0 transition-all duration-300
      ${selectedContact ? 'hidden md:flex' : 'flex w-full'} md:w-80 lg:w-96
      neu-bg ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}
    `}>
      
      {/* Header Section */}
      <div className="p-5 pb-3 shrink-0">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-bold tracking-tight">Chats</h2>
          {/* plus */}
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95, rotate: 90 }}
            onClick={() => setShowNewChat(true)}
            className={`w-10 h-10 flex items-center justify-center rounded-full neu-flat text-emerald-500 transition-all`}
          > 
            <Plus size={20} strokeWidth={2.5} />
          </motion.button> 
        </div>

        {/* Search Bar */}
        <div className={`flex items-center px-4 py-3 rounded-2xl neu-pressed shadow-inner transition-all`}>
          <Search size={18} className="opacity-50 mr-3" />
          <input 
            type="text" 
            placeholder="Search person to chat with..." 
            value={searchTerms}
            onChange={(e) => setSearchTerms(e.target.value)}
            className={`w-full bg-transparent border-none outline-none text-sm 
            ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}
            placeholder:text-current placeholder:opacity-40`}
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto px-3 pb-20 custom-scrollbar">
        {filteredContacts?.length > 0 ? (
          <div className="space-y-1.5 mt-2">
            {filteredContacts.map((contact, idx) => {
              const isSelected = selectedContact?._id === contact._id;
              
              // Find live conversation data
              const convArray = Array.isArray(conversations) ? conversations : (conversations?.data || [])
              const liveConversation = convArray.find(c => 
                c.participants?.some(p => p._id === contact._id)
              )
              
              const displayConversation = liveConversation || contact.conversation
              const lastMessage = displayConversation?.lastMessage
              const unreadCount = liveConversation?.unreadMessageCount || displayConversation?.unreadCount || 0
              const isOnline = isUserOnline(contact._id) || contact.isOnline
              const senderId = lastMessage?.sender?._id || lastMessage?.sender || lastMessage?.senderId

              return (
                <motion.div
                  key={contact._id || idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedContact(contact)}
                  className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'neu-pressed'
                      : 'hover:neu-flat'
                  }`}
                >
                  <div className="relative shrink-0">
                    {contact.profilePicture ? (
                      <img src={contact.profilePicture} alt={contact.username} className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-200/20" />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg shadow-sm ${theme === 'dark' ? 'bg-linear-to-br from-emerald-500 to-teal-600 text-white' : 'bg-linear-to-br from-emerald-400 to-teal-500 text-white'}`}>
                        {contact.username?.charAt(0).toUpperCase() || '?'}
                      </div>
                    )}
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 ml-1">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h3 className={`font-semibold text-[15px] truncate ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}`}>
                        {contact.username}
                      </h3>
                      {lastMessage && (
                        <span className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {formatTimestamp(lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className={`text-sm truncate pr-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {lastMessage 
                          ? (lastMessage.content || (
                              lastMessage.contentType === 'image' ? '📷 Photo' :
                              lastMessage.contentType === 'audio' ? '🎵 Audio' :
                              lastMessage.contentType === 'video' ? '🎥 Video' :
                              '📎 Attachment'
                            ))
                          : "Click to start chatting..."
                        }
                      </p>
                      {unreadCount > 0 && senderId !== user?._id && (
                        <span className={`shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold shadow-sm ${theme === 'dark' ? 'bg-emerald-500 text-slate-900' : 'bg-emerald-500 text-white'}`}>
                          {unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 opacity-60">
            <MessageSquare size={48} className="mb-4 text-emerald-500 opacity-50" />
            <p className="text-lg font-medium">No chats found</p>
            <p className="text-sm mt-1">Try searching for someone else.</p>
          </div>
        )}
      </div>
    </div>

    {/* New Chat / Group Modal — outside main div but inside Fragment */}
    <NewChatModal isOpen={showNewChat} onClose={() => setShowNewChat(false)} />
  </>
  )
}

export default ChatList