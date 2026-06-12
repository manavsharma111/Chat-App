import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, MessageSquare, Users, Check, Loader2, UserPlus } from 'lucide-react'
import useThemeStore from '../../store/themeStore'
import useUserStore from '../../store/useUserStore'
import useLayoutStore from '../../store/layoutStore'
import axiosInstance from '../../services/url.service'

const NewChatModal = ({ isOpen, onClose }) => {
  const { theme } = useThemeStore()
  const { user } = useUserStore()
  const setSelectedContact = useLayoutStore(state => state.setSelectedContact)

  const [tab, setTab] = useState('chat')           // 'chat' | 'group'
  const [query, setQuery] = useState('')
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState([])  // for group
  const [groupName, setGroupName] = useState('')
  const [creating, setCreating] = useState(false)

  const searchRef = useRef(null)

  // Fetch all users on open
  useEffect(() => {
    if (!isOpen) return
    setQuery('')
    setSelectedUsers([])
    setGroupName('')
    setTab('chat')

    const fetchUsers = async () => {
      setLoading(true)
      try {
        const { data } = await axiosInstance.get('/auth/get-all-user')
        // Exclude self
        const users = (data.data || data || []).filter(u => u._id !== user?._id)
        setAllUsers(users)
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
    setTimeout(() => searchRef.current?.focus(), 100)
  }, [isOpen])

  const filtered = allUsers.filter(u =>
    u.username?.toLowerCase().includes(query.toLowerCase()) ||
    u.email?.toLowerCase().includes(query.toLowerCase())
  )

  // New 1-on-1 Chat
  const handleStartChat = (contact) => {
    setSelectedContact(contact)
    onClose()
  }

  // Toggle group member
  const toggleGroupMember = (u) => {
    setSelectedUsers(prev =>
      prev.find(p => p._id === u._id)
        ? prev.filter(p => p._id !== u._id)
        : [...prev, u]
    )
  }

  // Create group (stub — wires up when group API exists)
  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length < 1) return
    setCreating(true)
    try {
      // Group conversation create karega (backend API ready hone par)
      alert(`Group "${groupName}" with ${selectedUsers.length + 1} members will be created.\n(Group API coming soon!)`)
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[500] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 60, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 60, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className={`w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] ${
            theme === 'dark' ? 'bg-gray-900 text-gray-100' : 'bg-white text-gray-900'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
            <h2 className="text-xl font-bold">New Conversation</h2>
            <button
              onClick={onClose}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                theme === 'dark' ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
              }`}
            >
              <X size={18} />
            </button>
          </div>

          {/* Tab Toggle */}
          <div className={`flex mx-5 mb-3 rounded-2xl p-1 shrink-0 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <button
              onClick={() => setTab('chat')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === 'chat'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : (theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
              }`}
            >
              <MessageSquare size={15} />
              New Chat
            </button>
            <button
              onClick={() => setTab('group')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-sm font-semibold transition-all ${
                tab === 'group'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : (theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
              }`}
            >
              <Users size={15} />
              New Group
            </button>
          </div>

          {/* Group Name Input (group tab only) */}
          <AnimatePresence>
            {tab === 'group' && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-5 mb-3 shrink-0 overflow-hidden"
              >
                <input
                  type="text"
                  placeholder="Group name..."
                  value={groupName}
                  onChange={e => setGroupName(e.target.value)}
                  className={`w-full px-4 py-2.5 rounded-2xl border text-sm font-medium outline-none transition-colors ${
                    theme === 'dark'
                      ? 'bg-gray-800 border-gray-700 text-gray-100 placeholder:text-gray-500 focus:border-emerald-500'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500'
                  }`}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Selected Members Chips (group) */}
          <AnimatePresence>
            {tab === 'group' && selectedUsers.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-5 mb-3 shrink-0 overflow-hidden"
              >
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map(u => (
                    <button
                      key={u._id}
                      onClick={() => toggleGroupMember(u)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-medium"
                    >
                      {u.username}
                      <X size={11} />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Search Bar */}
          <div className={`flex items-center mx-5 mb-3 px-4 py-2.5 rounded-2xl shrink-0 ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'
          }`}>
            <Search size={16} className="opacity-40 mr-2.5" />
            <input
              ref={searchRef}
              type="text"
              placeholder={tab === 'group' ? 'Search members to add...' : 'Search users...'}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-sm placeholder:opacity-50"
            />
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto px-3 pb-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 size={28} className="animate-spin text-emerald-500" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 opacity-50">
                <UserPlus size={40} className="mb-2" />
                <p className="text-sm">No users found</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filtered.map(u => {
                  const isSelected = selectedUsers.find(s => s._id === u._id)
                  return (
                    <motion.button
                      key={u._id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => tab === 'chat' ? handleStartChat(u) : toggleGroupMember(u)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all text-left ${
                        isSelected && tab === 'group'
                          ? (theme === 'dark' ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200')
                          : (theme === 'dark' ? 'hover:bg-gray-800' : 'hover:bg-gray-50')
                      }`}
                    >
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        {u.profilePicture ? (
                          <img src={u.profilePicture} alt={u.username}
                            className="w-11 h-11 rounded-full object-cover" />
                        ) : (
                          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-base">
                            {u.username?.charAt(0).toUpperCase()}
                          </div>
                        )}
                        {u.isOnline && (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{u.username}</p>
                        <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {u.isOnline ? '🟢 Online' : 'Offline'}
                        </p>
                      </div>

                      {/* Check (group mode) */}
                      {tab === 'group' && (
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? 'bg-emerald-500 border-emerald-500'
                            : (theme === 'dark' ? 'border-gray-600' : 'border-gray-300')
                        }`}>
                          {isSelected && <Check size={13} className="text-white" strokeWidth={3} />}
                        </div>
                      )}
                    </motion.button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Group Create Button */}
          <AnimatePresence>
            {tab === 'group' && selectedUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="px-5 pb-5 pt-2 shrink-0"
              >
                <button
                  onClick={handleCreateGroup}
                  disabled={creating || !groupName.trim()}
                  className="w-full py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  {creating ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Users size={18} />
                  )}
                  Create Group ({selectedUsers.length + 1} members)
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}

export default NewChatModal
