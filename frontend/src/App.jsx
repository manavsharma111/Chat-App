import React, { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Login from './pages/user-login/Login.jsx'
import SignUp from './pages/user-login/SignUp.jsx'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './components/Home.jsx'
import { PublicRoute, ProtectedRoute } from './Protected.jsx'
import User_Detail from './components/User_Detail.jsx';
import Status from './pages/status/Status.jsx';
import Setting from './pages/settings/Setting.jsx';
import CallRoom from './pages/call/CallRoom.jsx';
import IncomingCallModal from './pages/call/IncomingCallModal.jsx';
import useUserStore from './store/useUserStore.js';
import { useChatStore } from './store/chatStore.js';
import { useCallStore } from './store/useCallStore.js';
import { initializeSocket } from './services/chat.service.js';
import useThemeStore from './store/themeStore.js';
import { useStatusStore } from './store/useStatusStore.js';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import useLayoutStore from './store/layoutStore.js';
import Layout from './components/Layout.jsx';

const PageTransition = ({ children }) => {
  const pageClickPosition = useLayoutStore(state => state.pageClickPosition);
  
  React.useEffect(() => {
      if (pageClickPosition) {
          const timer = setTimeout(() => {
              useLayoutStore.getState().setPageClickPosition(null)
          }, 600)
          return () => clearTimeout(timer)
      }
  }, [pageClickPosition])

  return (
    <motion.div
      initial={pageClickPosition ? { 
         clipPath: `circle(0px at ${pageClickPosition.x}px ${pageClickPosition.y}px)`,
         opacity: 1, zIndex: 10
      } : { opacity: 0 }}
      animate={{ 
         clipPath: `circle(${Math.max(window.innerWidth, window.innerHeight) * 2}px at ${pageClickPosition?.x || window.innerWidth/2}px ${pageClickPosition?.y || window.innerHeight/2}px)`,
         opacity: 1, zIndex: 10
      }}
      exit={{ opacity: 0.99, zIndex: 0, transition: { duration: 0.6 } }} // Keep old page visible behind with explicit duration
      transition={{ type: "spring", stiffness: 200, damping: 25 }}
      className="col-start-1 row-start-1 w-full h-full bg-inherit"
    >
      {children}
    </motion.div>
  )
}

const AnimatedRoutes = () => {
  const location = useLocation();
  
  return (
    <AnimatePresence>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/user-profile" element={<PageTransition><User_Detail /></PageTransition>} />
        <Route path="/user-status" element={<PageTransition><Status /></PageTransition>} />
        <Route path="/settings" element={<PageTransition><Setting /></PageTransition>} />
      </Routes>
    </AnimatePresence>
  );
};

const AuthenticatedLayout = () => {
  return (
    <Layout>
      <div className="grid grid-cols-1 grid-rows-1 w-full h-full">
        <AnimatedRoutes />
      </div>
    </Layout>
  );
};

const App = () => {
  const {user} = useUserStore()
  const {setCurrentUser, initSocketListeners, cleanupSocket} = useChatStore()
  const { initCallListeners } = useCallStore()
  const { theme } = useThemeStore()

  useEffect(()=>{
    if(user?._id){
      const socket = initializeSocket()

      if(socket){
        setCurrentUser(user)
        initSocketListeners()
        useStatusStore.getState().initSocketListeners()
        initCallListeners()
      }

      return ()=>{
        if(cleanupSocket) cleanupSocket()
      }
    }
  },[user?._id])

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme])

  return (
    <>
      <ToastContainer position="top-right" autoClose={7000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="light"/>
      <Router>
        {/* Global incoming call modal — inside Router so useNavigate works */}
        <IncomingCallModal />
        <Routes>
          <Route element={<PublicRoute/>}>
            <Route path="/user-login" element={<Login />} />
          </Route>
          <Route element={<ProtectedRoute/>}>
            <Route path="/signup" element={<SignUp />} />
            <Route path="/call/:roomId" element={<CallRoom />} />
            <Route path="/*" element={<AuthenticatedLayout />} />
          </Route>
        </Routes>
      </Router>
    </>
  )
}

export default App