import React, { useState } from 'react'
import useUserStore from '../../store/useUserStore'
import * as Yup from 'yup'
import { User, Sparkles } from 'lucide-react'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import useThemeStore from '../../store/themeStore'
import BackgroundParticles from '../../store/BackgroundParticles'
import { motion } from 'framer-motion'
import Spinner from '../../utils/Spinner.jsx'
import { toast } from 'react-toastify'
import { updateUserProfile } from '../../services/user.service.js'

const profileValidationSchema = Yup.object().shape({
  username: Yup.string().required('username is required'),
  agreed: Yup.bool().oneOf([true], 'You must agree to the terms and conditions'),
})

const SignUp = () => {
  const [profilePicture, setProfilePicture] = useState(null)
  const [profilePictureFile, setProfilePictureFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user, setUser } = useUserStore()
  const { theme } = useThemeStore()

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({ resolver: yupResolver(profileValidationSchema) })


  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setProfilePictureFile(file)
      setProfilePicture(URL.createObjectURL(file))
    }
  }

  const onSubmitProfile = async (data) => {
    setLoading(true);
    try {
      const formData = new FormData()
      formData.append("username", data.username)
      formData.append("agreed", data.agreed.toString())
      if (profilePictureFile) formData.append("file", profilePictureFile)

      const response = await updateUserProfile(formData);

      const verifiedUser = response.data?.data?.user || response.data?.user;
      if (response.status?.toLowerCase() === 'success' && verifiedUser) {
        setUser(verifiedUser);
        toast.success("Welcome to ChatApp!");
        navigate("/");
      } else {
        throw new Error(response.message || 'Failed to create profile.');
      }
    } catch (error) {
      console.error('Failed to create profile:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div
      className={`relative min-h-screen w-full overflow-x-hidden ${theme === 'dark'
          ? 'bg-gradient-to-br from-slate-950 via-purple-950 to-indigo-950 text-white'
          : 'bg-gradient-to-br from-purple-100 via-fuchsia-100 to-indigo-200 text-gray-800'
        }`}
    >
      <div className="absolute inset-0 z-0">
        <BackgroundParticles role={theme === 'dark' ? 'candidate' : 'employer'} />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, type: 'spring', ease: 'easeInOut' }}
          className={`${theme === 'dark' ? 'text-white bg-white/10 border-white/20' : 'bg-white/35 text-gray-800 border-white/50'
            } w-full max-w-lg p-6 md:p-8 rounded-3xl border shadow-[0_20px_80px_-20px_rgba(0,0,0,0.45)] backdrop-blur-2xl`}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-20 h-20 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-[0_10px_25px_rgba(168,85,247,0.4)]"
          >
            <Sparkles size={46} color="#ffffff" strokeWidth={2.8} />
          </motion.div>

          <h1 className={`text-3xl font-bold text-center ${theme === 'dark' ? 'text-purple-300' : 'text-slate-800'}`}>
            Complete Profile
          </h1>
          <p className={`mt-2 mb-8 text-center text-sm ${theme === 'dark' ? 'text-slate-200/90' : 'text-slate-600'}`}>
            Set up your name and profile picture to get started
          </p>

          <form className="space-y-6" onSubmit={handleProfileSubmit(onSubmitProfile)}>
            <div className="relative flex items-center justify-center ">
              <label htmlFor="profilePictureInput" className="cursor-pointer flex flex-col items-center">
                {profilePicture ? (
                  <img src={profilePicture} alt="Profile Preview" className="w-28 h-28 rounded-full object-cover border-4 border-purple-500 shadow-xl transition-transform hover:scale-105" />
                ) : (
                  <div className={`w-28 h-28 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-slate-700/50 text-gray-300' : 'bg-white/50 text-gray-600'} border-2 border-dashed border-purple-400 shadow-md transition-transform hover:scale-105`}>
                    <User size={40} className="opacity-70" />
                  </div>
                )}
                <input
                  id="profilePictureInput"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  className="hidden"
                />
                <span className={`mt-4 text-sm font-medium ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`}>
                  Upload Picture
                </span>
              </label>
            </div>

            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <User size={20} className={theme === 'dark' ? 'text-purple-400' : 'text-purple-500'} />
              </div>
              <input
                type="text"
                {...profileRegister('username')}
                placeholder="Choose a Username"
                className={`w-full py-3.5 pl-11 pr-4 text-base ${theme === 'dark' ? 'text-white bg-slate-800/90 border-slate-500' : 'text-gray-900 bg-white/90 border-slate-300'
                  } border rounded-xl focus:ring-2 focus:ring-purple-400 focus:outline-none transition-all ${profileErrors.username ? 'border-red-500' : ''
                  }`}
              />
              {profileErrors.username && <p className="text-red-500 text-xs mt-1 px-1">{profileErrors.username.message}</p>}
            </div>

            <div className="flex items-center px-1">
              <input
                type="checkbox"
                {...profileRegister('agreed')}
                id="termsAgreed"
                className={`h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded ${theme === 'dark' ? 'bg-slate-700 border-slate-500' : ''
                  }`}
              />
              <label htmlFor="termsAgreed" className={`ml-3 block text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                I agree to the <span className="text-purple-500 hover:underline cursor-pointer font-medium">Terms and Conditions</span>
              </label>
            </div>
            {profileErrors.agreed && <p className="text-red-500 text-xs mt-1 px-1">{profileErrors.agreed.message}</p>}
            
            <button
              onClick={handleProfileSubmit(onSubmitProfile)}
              className="w-full mt-4 py-3.5 rounded-2xl cursor-pointer relative overflow-hidden isolate text-white font-bold tracking-wide bg-linear-to-r from-purple-500 to-indigo-500 backdrop-blur-xl border border-white/30 shadow-[0_8px_32px_rgba(168,85,247,0.3)] before:content-[''] before:absolute before:inset-0 before:bg-linear-to-t before:from-white/20 before:to-transparent before:translate-y-full before:transition-transform before:duration-500 before:ease-[cubic-bezier(0.22,1,0.36,1)] before:-z-10 hover:before:translate-y-0 hover:border-purple-300 hover:shadow-[0_10px_40px_rgba(168,85,247,0.5)] transition-all duration-300"
            >
              {loading ? <Spinner size="small" color="light" /> : 'Get Started'}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default SignUp
