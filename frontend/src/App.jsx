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
            <Route path="/" element={<Home />} />
            <Route path="/user-profile" element={<User_Detail />} />
            <Route path="/user-status" element={<Status />} />
            <Route path="/settings" element={<Setting />} />
            <Route path="/call/:roomId" element={<CallRoom />} />
          </Route>
        </Routes>
      </Router>
    </>
  )
}

export default App