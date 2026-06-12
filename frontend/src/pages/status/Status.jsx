import React, { useEffect, useState, useRef } from 'react';
import Layout from '../../components/Layout';
import { motion } from 'framer-motion';
import useThemeStore from '../../store/themeStore';
import useUserStore from '../../store/useUserStore';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useStatusStore } from '../../store/useStatusStore';
import { formatDistanceToNow } from 'date-fns';
import StatusViewer from './StatusViewer';

const Status = () => {
  const { theme, primaryColor } = useThemeStore();
  const { user } = useUserStore();
  const { statuses, fetchStatuses, createStatus, loading } = useStatusStore();
  
  const [activeUserStatuses, setActiveUserStatuses] = useState(null);
  const [isMyStatus, setIsMyStatus] = useState(false);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchStatuses();
  }, [fetchStatuses]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error("File size should be less than 10MB");
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('contentType', file.type.startsWith('image/') ? 'image' : 'video');

    try {
      setUploading(true);
      await createStatus(formData);
      toast.success("Status updated!");
    } catch (error) {
      toast.error("Failed to update status");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const myStatuses = statuses.filter(s => s.user._id === user?._id);
  
  const otherStatuses = statuses.filter(s => s.user._id !== user?._id);
  const groupedOtherStatuses = otherStatuses.reduce((acc, status) => {
    if (!acc[status.user._id]) {
      acc[status.user._id] = {
        user: status.user,
        statuses: [],
        allViewed: true,
        latestUpdate: new Date(status.createdAt)
      };
    }
    acc[status.user._id].statuses.push(status);
    
    // Check if viewed
    const isViewed = status.viewers?.some(v => v._id === user?._id || v === user?._id);
    if (!isViewed) acc[status.user._id].allViewed = false;
    
    // Update latest time
    const statusDate = new Date(status.createdAt);
    if (statusDate > acc[status.user._id].latestUpdate) {
      acc[status.user._id].latestUpdate = statusDate;
    }
    
    return acc;
  }, {});

  const recentUpdates = Object.values(groupedOtherStatuses)
    .filter(g => !g.allViewed)
    .sort((a, b) => b.latestUpdate - a.latestUpdate);
    
  const viewedUpdates = Object.values(groupedOtherStatuses)
    .filter(g => g.allViewed)
    .sort((a, b) => b.latestUpdate - a.latestUpdate);

  const openStatusViewer = (userStatusesGroup, isMine = false) => {
    if (!userStatusesGroup || userStatusesGroup.length === 0) return;
    setIsMyStatus(isMine);
    setActiveUserStatuses(userStatusesGroup);
  };

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className={`h-full w-full flex flex-col overflow-y-auto neu-bg ${theme === 'dark' ? 'text-gray-200' : 'text-gray-600'}`}
      >
        <div className="max-w-2xl mx-auto w-full p-4 sm:p-8 pt-12">
          
          <div className="flex justify-between items-center mb-8 relative">
            <h1 className="text-3xl font-extrabold tracking-tight opacity-90">Status</h1>
          </div>

          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept="image/*,video/*" 
            onChange={handleFileChange}
          />

          {/* My Status */}
          <div className="mb-10">
            <div className="flex items-center p-4 rounded-3xl neu-flat transition-all">
              <div className="relative cursor-pointer hover:scale-105 transition-transform" onClick={() => openStatusViewer(myStatuses, true)}>
                <div 
                  className={`w-14 h-14 rounded-full p-1 flex items-center justify-center ${myStatuses.length > 0 ? 'border-2' : 'neu-pressed'}`}
                  style={{ borderColor: myStatuses.length > 0 ? primaryColor : 'transparent' }}
                >
                  {user?.profilePicture ? (
                    <img src={user.profilePicture} alt="My Status" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <div 
                      className="w-full h-full rounded-full flex items-center justify-center text-xl font-bold text-white shadow-inner"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {user?.username?.charAt(0).toUpperCase() || 'M'}
                    </div>
                  )}
                </div>
                
                <div 
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="absolute bottom-0 right-0 w-5 h-5 rounded-full flex items-center justify-center text-white neu-flat border-2 border-transparent cursor-pointer hover:scale-110"
                  style={{ backgroundColor: primaryColor }}
                >
                  {uploading ? <Loader2 size={12} className="animate-spin" /> : <Plus size={14} strokeWidth={4} />}
                </div>
              </div>
              <div 
                className="ml-4 flex-1 cursor-pointer" 
                onClick={() => {
                  if (myStatuses.length > 0) openStatusViewer(myStatuses, true);
                  else fileInputRef.current?.click();
                }}
              >
                <h3 className="font-bold text-lg opacity-90">My status</h3>
                <p className="text-sm opacity-60 font-medium mt-0.5">
                  {uploading ? 'Uploading...' : myStatuses.length > 0 ? 'Tap to view your status' : 'Tap to add status update'}
                </p>
              </div>
            </div>
          </div>

          {loading && statuses.length === 0 && (
            <div className="flex justify-center my-8">
              <Loader2 className="animate-spin opacity-50" size={32} />
            </div>
          )}

          {/* Recent Updates */}
          {recentUpdates.length > 0 && (
            <div className="mb-8">
              <h4 className="text-sm font-bold uppercase tracking-wider opacity-50 mb-4 px-2">Recent updates</h4>
              <div className="space-y-4">
                {recentUpdates.map((group) => (
                  <div 
                    key={group.user._id} 
                    onClick={() => openStatusViewer(group.statuses)}
                    className="flex items-center p-3 px-4 rounded-3xl hover:neu-flat cursor-pointer transition-all"
                  >
                    <div 
                      className="w-14 h-14 rounded-full p-[3px]"
                      style={{ background: `linear-gradient(45deg, ${primaryColor}, #3b82f6)` }}
                    >
                      <div className="w-full h-full rounded-full border-2 border-[#e0e5ec] dark:border-[#0f172a] overflow-hidden">
                        <img 
                          src={group.user.profilePicture || `https://ui-avatars.com/api/?name=${group.user.username}`} 
                          alt={group.user.username} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-bold text-base opacity-90">{group.user.username}</h3>
                      <p className="text-xs opacity-60 font-medium mt-0.5">
                        {formatDistanceToNow(group.latestUpdate, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Viewed Updates */}
          {viewedUpdates.length > 0 && (
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider opacity-50 mb-4 px-2">Viewed updates</h4>
              <div className="space-y-4">
                {viewedUpdates.map((group) => (
                  <div 
                    key={group.user._id} 
                    onClick={() => openStatusViewer(group.statuses)}
                    className="flex items-center p-3 px-4 rounded-3xl hover:neu-flat cursor-pointer transition-all opacity-70"
                  >
                    <div className="w-14 h-14 rounded-full p-[2px] bg-gray-400 dark:bg-gray-600">
                      <div className="w-full h-full rounded-full border-2 border-[#e0e5ec] dark:border-[#0f172a] overflow-hidden">
                        <img 
                          src={group.user.profilePicture || `https://ui-avatars.com/api/?name=${group.user.username}`} 
                          alt={group.user.username} 
                          className="w-full h-full object-cover grayscale" 
                        />
                      </div>
                    </div>
                    <div className="ml-4 flex-1">
                      <h3 className="font-bold text-base opacity-90">{group.user.username}</h3>
                      <p className="text-xs opacity-60 font-medium mt-0.5">
                        {formatDistanceToNow(group.latestUpdate, { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="h-20"></div>
        </div>
      </motion.div>

      {/* Status Viewer Modal */}
      {activeUserStatuses && (
        <StatusViewer 
          userStatuses={activeUserStatuses} 
          isMyStatus={isMyStatus}
          onClose={() => setActiveUserStatuses(null)} 
        />
      )}
    </Layout>
  );
};

export default Status;