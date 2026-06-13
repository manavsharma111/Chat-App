import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import useUserStore from '../store/useUserStore'
import useLayoutStore from '../store/layoutStore'
import { BotMessageSquare, MessageSquare, Clock, Users, Bookmark, User, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { IoMdRadioButtonOn } from "react-icons/io"
import { CgProfile } from "react-icons/cg"
import { MdOutlineSettings } from "react-icons/md"

const MotionSettingsIcon = motion.create ? motion.create(MdOutlineSettings) : motion(MdOutlineSettings);


const Sidebar = () => {
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const { theme, setTheme } = useThemeStore()
  const { user } = useUserStore()
  const { activeTab, setActiveTab, selectedContact } = useLayoutStore()

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])
  useEffect(() => {
    if (location.pathname === '/') setActiveTab('chats')
    else if (location.pathname === '/user-status') setActiveTab('status')
    else if (location.pathname === '/groups') setActiveTab('groups')
    else if (location.pathname === '/stories') setActiveTab('stories')
    else if (location.pathname === '/user-profile') setActiveTab('user-profile')
    else if (location.pathname === '/settings') setActiveTab('settings')
  }, [location, setActiveTab, selectedContact])
  if (isMobile && selectedContact) return null
  const tabs = [
    { id: 'chats', icon: <MessageSquare size={22} />, name: 'Chats' },
    { id: 'status', icon: <Clock size={22} />, name: 'Status' },
    { id: 'groups', icon: <Users size={22} />, name: 'Groups' },
    { id: 'stories', icon: <Bookmark size={22} />, name: 'Stories' },
    { id: 'profile', icon: <User size={22} />, name: 'Profile' },
    { id: 'settings', icon: <Settings size={22} />, name: 'Settings' },
  ]
  const SidebarContent = (
    <>
      <Link
        to='/'
        onClick={(e) => useLayoutStore.getState().setPageClickPosition({ x: e.clientX, y: e.clientY })}
        className={`w-12 h-12 flex shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${isMobile ? "" : "mb-6"} ${activeTab === 'chats' ? 'bg-white shadow-sm dark:bg-gray-800 text-blue-500 scale-105' : 'text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:scale-105'} focus:outline-none`}
      >
        <BotMessageSquare className="h-6 w-6" color={activeTab === 'chats' ? 'currentColor' : 'gray'} />
      </Link>

      <Link
        to='/user-status'
        onClick={(e) => useLayoutStore.getState().setPageClickPosition({ x: e.clientX, y: e.clientY })}
        className={`w-12 h-12 flex shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${isMobile ? "" : "mb-6"} ${activeTab === 'status' ? 'bg-white shadow-sm dark:bg-gray-800 text-blue-500 scale-105' : 'text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:scale-105'} focus:outline-none`}
      >
        <IoMdRadioButtonOn className="h-6 w-6" color={activeTab === 'status' ? 'currentColor' : 'gray'} />
      </Link>

      {!isMobile && <div className='grow justify-end'/>}

      <Link
        to='/user-profile'
        onClick={(e) => useLayoutStore.getState().setPageClickPosition({ x: e.clientX, y: e.clientY })}
        className={`w-12 h-12 flex shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${isMobile ? "" : "mb-6"} ${activeTab === 'user-profile' ? 'bg-white shadow-sm dark:bg-gray-800 text-blue-500 scale-105' : 'text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:scale-105'} focus:outline-none`}
      >
        {user?.profilePicture ? (
          <img src={user.profilePicture} alt="Profile" className="h-7 w-7 rounded-full object-cover" />
        ) : (
          <CgProfile className="h-6 w-6" color={activeTab === 'user-profile' ? 'currentColor' : 'gray'} />
        )}
      </Link>

      <Link
        to='/settings'
        onClick={(e) => useLayoutStore.getState().setPageClickPosition({ x: e.clientX, y: e.clientY })}
        className={`w-12 h-12 flex shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${isMobile ? "" : "mb-6"} ${activeTab === 'settings' ? 'bg-white shadow-sm dark:bg-gray-800 text-blue-500 scale-105' : 'text-gray-400 hover:bg-black/5 dark:hover:bg-white/5 hover:scale-105'} focus:outline-none`}
      >
        <MotionSettingsIcon 
          className="h-6 w-6"
          color={activeTab === 'settings' ? 'currentColor' : 'gray'}
          whileTap={{ rotate: 45 }}
          transition={{ duration: 0.1, ease: "easeOut" }}
        />
      </Link>
    </>
  )

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{
        opacity: 1
      }}
      transition={{
        duration: 0.3,
        ease: 'easeInOut'
      }}
      className={`
        ${isMobile ? "fixed bottom-0 left-0 right-0 h-16 z-50" : " w-[72px] h-full border-r "}
        ${theme === 'dark' ? 'bg-[#0f172a]/80' : 'bg-[#e0e5ec]/80'} backdrop-blur-md border-black/5 dark:border-white/5 flex items-center py-4 
        ${isMobile ? 'flex-row justify-around border-t' : 'flex-col justify-start px-3'}
        `}
    >
      {SidebarContent}

    </motion.div>
  )
}

export default Sidebar