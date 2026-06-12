import React, { useState } from 'react'
import { useEffect } from 'react'
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

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768)
        }
        window.addEventListener('resize', handleResize)
        return () => {
            window.removeEventListener('resize', handleResize)
        }
    }, [])


    return (
        <div className={`h-screen neu-bg ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'} flex relative`} >
            {!isMobile && <Sidebar />}
            <div
                className={`flex-1 flex overflow-hidden ${isMobile ? "flex-col" : ""}`}>
                <AnimatePresence
                    initial={false}
                    exitBeforeEnter
                >
                    {(!selectedContact || !isMobile) && (
                        <motion.div
                            key="chatList"
                            initial={{ x: isMobile ? "-100%" : "0" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{
                                type: "tween",
                                duration: 0.5
                            }}
                            className={`w-full md:w-auto h-full shrink-0 ${isMobile ? "pb-16" : ""}`}
                        >
                            {children}
                        </motion.div>
                    )}
                    {(selectedContact || !isMobile) && (
                        <motion.div
                            key="chatWindow"
                            initial={{ x: isMobile ? "-100%" : "0" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{
                                type: "tween",
                                duration: 0.5
                            }}
                            className={`flex-1 w-full h-full`}
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