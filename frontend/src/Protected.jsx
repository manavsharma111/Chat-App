import React, { useState, useEffect } from "react"
import { Navigate, useLocation, Outlet } from "react-router-dom"
import useUserStore from "./store/useUserStore"
import { checkUserAuth } from "./services/user.service"
import { Loader, BotMessageSquare } from "lucide-react"
import { motion } from "framer-motion"
import { toast } from "react-toastify"

export const ProtectedRoute = () => {
    const location = useLocation()
    const [isChecking, setIsChecking] = useState(true)
    const { isAuthenticate, setUser, clearUser, user } = useUserStore()

    useEffect(() => {
        const verifyAuth = async () => {
            try {
                const result = await checkUserAuth()
                if (result?.isAuthenticate) setUser(result.user)
                else clearUser()
            }
            catch (e) {
                console.error(e)
                if (e?.message === 'Unauthorized' || e?.status === 'Failure') {
                    clearUser()
                }
                // Don't clear user on pure network errors so they stay logged in
            }
            finally {
                setIsChecking(false)
            }
        }
        verifyAuth()
    }, [setUser, clearUser])

    if (isChecking) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-950">
                <motion.div
                    animate={{ 
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 6,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                    className="relative flex items-center justify-center mb-6"
                >
                    {/* Glowing background blur */}
                    <div className="absolute inset-0 bg-emerald-500/30 rounded-full blur-2xl animate-pulse" />
                    
                    {/* Glassmorphic icon container */}
                    <div className="relative bg-slate-800/40 p-5 rounded-2xl border border-slate-700/50 shadow-2xl backdrop-blur-md">
                        <BotMessageSquare className="text-emerald-400" size={52} strokeWidth={1.5} />
                    </div>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center gap-3"
                >
                    <h2 className="text-lg font-medium text-slate-300 tracking-wider">
                        Starting Chat
                    </h2>
                    
                    {/* Animated dots */}
                    <div className="flex gap-1.5">
                        {[0, 1, 2].map((i) => (
                            <motion.div
                                key={i}
                                animate={{ opacity: [0.2, 1, 0.2], y: [0, -3, 0] }}
                                transition={{ 
                                    duration: 1.2, 
                                    repeat: Infinity, 
                                    delay: i * 0.2,
                                    ease: "easeInOut" 
                                }}
                                className="w-1.5 h-1.5 rounded-full bg-emerald-500" 
                            />
                        ))}
                    </div>
                </motion.div>
            </div>
        )
    }
    if (!isAuthenticate) return <Navigate to="/user-login" state={{ from: location }} replace />
    
    if (user && !user.isProfileCompleted && location.pathname !== '/signup') {
        return <Navigate to="/signup" replace />
    }
    
    if (user && user.isProfileCompleted && location.pathname === '/signup') {
        return <Navigate to="/" replace />
    }

    // user is auth - render the protected routes    
    return <Outlet />
}

export const PublicRoute = () => {
    const isAuthenticate = useUserStore(state => state.isAuthenticate)
    if (isAuthenticate) return <Navigate to="/" replace />
    return <Outlet />
}
