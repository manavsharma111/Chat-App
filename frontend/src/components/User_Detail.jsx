import React, { useState } from 'react';
import Layout from './Layout';
import { motion } from 'framer-motion';
import useThemeStore from '../store/themeStore';
import useUserStore from '../store/useUserStore';
import { Camera, Edit2, LogOut, Mail, User, Phone, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const User_Detail = () => {
  const { theme, primaryColor } = useThemeStore();
  const { user, clearUser } = useUserStore();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || 'Guest User',
    email: user?.email || 'guest@example.com',
    bio: user?.bio || 'Hey there! I am using this amazing Chat App.',
    phone: user?.phone || '+91 9876543210'
  });

  const handleLogout = () => {
    clearUser();
    navigate('/user-login');
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
      <motion.div
        className={`h-full w-full flex flex-col overflow-y-auto neu-bg ${theme === 'dark' ? 'text-gray-200' : 'text-gray-600'}`}
      >
        <div className="max-w-2xl mx-auto w-full p-4 sm:p-8 pt-12">
          
          {/* Header */}
          <div className="flex justify-between items-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight opacity-90">
              Profile
            </h1>
            <button 
              onClick={handleLogout}
              className="p-3 rounded-2xl neu-flat text-red-500 hover:scale-105 active:neu-pressed transition-all"
              title="Logout"
            >
              <LogOut size={22} />
            </button>
          </div>

          {/* Avatar Section */}
          <div className="flex flex-col items-center justify-center mb-12 relative">
            <div className="relative group">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full neu-flat p-2 flex items-center justify-center">
                {user?.profilePicture ? (
                  <img 
                    src={user.profilePicture} 
                    alt="Profile" 
                    className="w-full h-full rounded-full object-cover shadow-inner"
                  />
                ) : (
                  <div 
                    className="w-full h-full rounded-full flex items-center justify-center text-5xl font-bold shadow-inner"
                    style={{ backgroundColor: primaryColor, color: '#fff' }}
                  >
                    {formData.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <button 
                className="absolute bottom-2 right-2 p-3 rounded-full neu-flat text-white transition-all hover:scale-110 active:neu-pressed"
                style={{ backgroundColor: primaryColor }}
              >
                <Camera size={20} />
              </button>
            </div>
            
            <h2 className="mt-6 text-2xl font-bold opacity-90">{formData.username}</h2>
            <p className="text-sm opacity-60 font-medium tracking-wide mt-1">{formData.email}</p>
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-bold opacity-80">Personal Information</h3>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className={`p-2 px-4 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isEditing ? 'neu-pressed text-blue-500' : 'neu-flat hover:scale-105'}`}
                style={{ color: isEditing ? primaryColor : undefined }}
              >
                <Edit2 size={16} />
                {isEditing ? 'Save' : 'Edit'}
              </button>
            </div>

            <div className="p-6 rounded-3xl neu-flat space-y-6">
              
              {/* Field 1: Name */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
                  <User size={14} /> Name
                </label>
                <input 
                  type="text" 
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`w-full p-3 rounded-xl transition-all outline-none font-medium ${isEditing ? 'neu-pressed bg-transparent' : 'bg-transparent'}`}
                />
              </div>

              {/* Field 2: Bio */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
                  <Info size={14} /> About
                </label>
                <textarea 
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  rows={2}
                  className={`w-full p-3 rounded-xl transition-all outline-none font-medium resize-none ${isEditing ? 'neu-pressed bg-transparent' : 'bg-transparent'}`}
                />
              </div>

              {/* Field 3: Phone */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider opacity-60 flex items-center gap-2">
                  <Phone size={14} /> Phone
                </label>
                <input 
                  type="text" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  readOnly={!isEditing}
                  className={`w-full p-3 rounded-xl transition-all outline-none font-medium ${isEditing ? 'neu-pressed bg-transparent' : 'bg-transparent'}`}
                />
              </div>

            </div>
          </div>
          
          {/* Spacer */}
          <div className="h-20"></div>

        </div>
      </motion.div>
    </>
  );
};

export default User_Detail;