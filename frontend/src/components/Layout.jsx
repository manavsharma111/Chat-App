import React, { useState, useRef, useEffect } from 'react'
import useLayoutStore from '../store/layoutStore'
import Sidebar from './Sidebar'
import { useLocation } from 'react-router-dom'
import useThemeStore from '../store/themeStore'
import { AnimatePresence, motion } from 'framer-motion'
import ChatWindow from '../pages/chats/ChatWindow'


const Layout = ({ children, isThemeDialogOpen, toggleThemeDialog, isStatusPreviewOpen, statusPreviewContent }) => {
    const selectedContact = useLayoutStore(state => state.selectedContact)
    const setSelectedContact = useLayoutStore(state => state.setSelectedContact)
    const location = useLocation()
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
    const { theme, setTheme } = useThemeStore()
    const isFirstMount = useRef(true)

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768)
        }
        window.addEventListener('resize', handleResize)
        isFirstMount.current = false
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])


    const clickPosition = useLayoutStore(state => state.clickPosition)

    return (
        <div className={`h-screen neu-bg ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} flex relative`} >
            {!isMobile && <Sidebar />}
            <div
                className={`flex-1 flex overflow-hidden relative ${isMobile ? "flex-col" : ""}`}>
                <AnimatePresence>
                    {(!selectedContact || !isMobile) && (
                        <motion.div
                            key="chatList"
                            initial={isMobile ? { opacity: 0, scale: 0.95 } : false}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={isMobile ? { opacity: 0, scale: 0.95 } : { opacity: 1, scale: 1 }}
                            transition={{
                                type: "spring",
                                stiffness: 300,
                                damping: 30
                            }}
                            className={`w-full md:w-auto h-full shrink-0 relative ${isMobile ? "pb-16 absolute inset-0 z-10 bg-inherit" : ""}`}
                        >
                            {children}
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* ChatWindow Container */}
                <div className={`${isMobile ? 'absolute inset-0 z-20 pointer-events-none' : 'flex-1'} grid grid-cols-1 grid-rows-1 w-full h-full`}>
                    <AnimatePresence>
                        {(selectedContact || !isMobile) && (
                            <motion.div
                                key={`chatWindow-${selectedContact?._id || 'empty'}`}
                                initial={{ 
                                    clipPath: `circle(0px at ${clickPosition?.x || window.innerWidth/2}px ${clickPosition?.y || window.innerHeight/2}px)`,
                                    opacity: 1, zIndex: 10
                                }}
                                animate={{ 
                                    clipPath: `circle(${Math.max(window.innerWidth, window.innerHeight) * 2}px at ${clickPosition?.x || window.innerWidth/2}px ${clickPosition?.y || window.innerHeight/2}px)`,
                                    opacity: 1, zIndex: 10
                                }}
                                exit={{ opacity: 0.99, zIndex: 0, transition: { duration: 0.6 } }}
                                transition={{
                                    type: "spring",
                                    stiffness: 200,
                                    damping: 25
                                }}
                                className={`col-start-1 row-start-1 w-full h-full bg-inherit ${isMobile ? 'pointer-events-auto' : ''}`}
                            >
                                <ChatWindow
                                    selectedContact={selectedContact}
                                    setSelectedContact={setSelectedContact}
                                    isMobile={isMobile}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            {isMobile && <Sidebar />}


            {isThemeDialogOpen && (
                <div className="fixed inset-8 flex items-center justify-center z-50 bg-black bg-opacity-50">

                    <div className={`${theme === 'dark' ? 'bg-slate-950 text-white' : 'bg-gray-100 text-black'} p-6 rounded-lg shadow-lg max-w-md w-full`}>
                        <h2 className="text-2xl font-semibold mb-4">
                            Choose a theme
                        </h2>
                        <div className="space-y-4">
                            <label className='flex items-center space-x-2 cursor-pointer ' >
                                <input
                                    type='radio'
                                    value='light'
                                    checked={theme === 'light'}
                                    onChange={() => setTheme('light')}
                                    className='from-radio text-blue-600'
                                />
                                <span>Light</span>
                            </label>
                            <label className='flex items-center space-x-2 cursor-pointer ' >
                                <input
                                    type='radio'
                                    value='dark'
                                    checked={theme === 'dark'}
                                    onChange={() => setTheme('dark')}
                                    className='from-radio text-blue-600'
                                />
                                <span>Dark</span>
                            </label>
                        </div>
                        <button
                            onClick={toggleThemeDialog}
                            className="mt-6 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors duration-300">
                            Close
                        </button>
                    </div>
                </div>
            )}
            {/* status preview */}
            {isStatusPreviewOpen && (
                <div className=" fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    {statusPreviewContent}
                </div>
            )}
        </div>
    )
}

export default Layout