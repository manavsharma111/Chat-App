import React, { useRef } from 'react';
import Layout from '../../components/Layout';
import { motion } from 'framer-motion';
import useThemeStore from '../../store/themeStore';
import { ArrowLeft, Moon, Sun, Image as ImageIcon, Palette, Trash2, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Setting = () => {
  const { theme, setTheme, chatBackground, setChatBackground, setPrimaryColor } = useThemeStore();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setChatBackground(reader.result);
        
        // Extract dominant color
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          canvas.width = img.width;
          canvas.height = img.height;
          ctx.drawImage(img, 0, 0, img.width, img.height);
          
          try {
            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
            let r = 0, g = 0, b = 0, count = 0;
            for (let i = 0; i < data.length; i += 40) {
              r += data[i];
              g += data[i + 1];
              b += data[i + 2];
              count++;
            }
            r = Math.floor(r / count);
            g = Math.floor(g / count);
            b = Math.floor(b / count);
            // Boost visibility by making it slightly darker or vibrant
            setPrimaryColor(`rgb(${r}, ${g}, ${b})`);
          } catch(e) {
            console.error("Could not extract color", e);
            setPrimaryColor('#b04f91');
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveBackground = () => {
    setChatBackground('default');
    setPrimaryColor('#b04f91');
  };

  const presetThemes = {
    'default': '#b04f91',
    '#f8fafc': '#475569', // Slate Light
    '#1e293b': '#64748b', // Slate Dark
    '#fef2f2': '#ef4444', // Red Light
    '#7f1d1d': '#b91c1c', // Red Dark
    '#fffbeb': '#f59e0b', // Amber Light
    '#78350f': '#d97706', // Amber Dark
    '#f0fdf4': '#22c55e', // Green Light
    '#14532d': '#16a34a', // Green Dark
    '#eff6ff': '#3b82f6', // Blue Light
    '#1e3a8a': '#2563eb', // Blue Dark
    '#f5f3ff': '#8b5cf6', // Violet Light
    '#4c1d95': '#7c3aed', // Violet Dark
    '#fdf2f8': '#ec4899', // Pink Light
    '#831843': '#be185d', // Pink Dark
    '#ecfdf5': '#10b981', // Emerald Light
    '#064e3b': '#059669', // Emerald Dark
    '#fefce8': '#eab308', // Yellow Light
    '#713f12': '#ca8a04', // Yellow Dark
    '#fff1f2': '#f43f5e', // Rose Light
    '#881337': '#e11d48', // Rose Dark
    '#f0f9ff': '#0ea5e9', // Sky Light
    '#0c4a6e': '#0284c7', // Sky Dark
    '#faf5ff': '#a855f7', // Purple Light
    '#581c87': '#9333ea', // Purple Dark
    '#fdf4ff': '#d946ef', // Fuchsia Light
    '#701a75': '#c026d3', // Fuchsia Dark
    '#fff7ed': '#f97316', // Orange Light
    '#7c2d12': '#ea580c', // Orange Dark
    '#f0fdfa': '#14b8a6', // Teal Light
    '#134e4a': '#0d9488', // Teal Dark
    '#111827': '#4b5563', // Gray Dark
    '#18181b': '#52525b', // Zinc Dark
    '#0f172a': '#475569', // Slate Deep
    '#020617': '#334155', // Midnight Blue
  };

  const presetColors = Object.keys(presetThemes).filter(k => k !== 'default');

  const handlePresetSelect = (color) => {
    setChatBackground(color);
    setPrimaryColor(presetThemes[color] || '#b04f91');
  };

  return (
    <>
      <motion.div
        className={`h-full w-full flex flex-col overflow-y-auto neu-bg ${theme === 'dark' ? 'text-gray-200' : 'text-gray-600'}`}
      >
        <div className="max-w-lg mx-auto w-full p-4 sm:p-8 pt-12">
          
          {/* Header */}
          <div className="flex items-center gap-4 mb-10">
            <button
              onClick={() => navigate('/')}
              className="w-12 h-12 rounded-full neu-flat flex items-center justify-center transition-all hover:scale-105 active:scale-95 text-blue-500"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight opacity-90">Settings</h1>
             
            </div>
          </div>

          {/* Content Container */}
          <div className="w-full space-y-10">
            
            {/* Appearance Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 ml-2">
              <Palette size={20} className="text-blue-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider opacity-70">App Theme</h2>
            </div>
            
            <div className="neu-flat rounded-3xl p-8">
              <div className="flex gap-6">
                <button
                  onClick={() => setTheme('light')}
                  className={`flex-1 flex flex-col items-center justify-center gap-4 py-8 rounded-2xl transition-all duration-300 ${theme === 'light' ? 'neu-pressed' : 'neu-flat hover:scale-[1.02] active:scale-95'}`}
                >
                  <Sun size={32} className={theme === 'light' ? 'text-blue-500' : 'opacity-40'} />
                  <span className={`text-base font-bold ${theme === 'light' ? 'text-blue-500' : 'opacity-60'}`}>Light Mode</span>
                </button>

                <button
                  onClick={() => setTheme('dark')}
                  className={`flex-1 flex flex-col items-center justify-center gap-4 py-8 rounded-2xl transition-all duration-300 ${theme === 'dark' ? 'neu-pressed' : 'neu-flat hover:scale-[1.02] active:scale-95'}`}
                >
                  <Moon size={32} className={theme === 'dark' ? 'text-blue-500' : 'opacity-40'} />
                  <span className={`text-base font-bold ${theme === 'dark' ? 'text-blue-500' : 'opacity-60'}`}>Dark Mode</span>
                </button>
              </div>
            </div>
          </section>

          {/* Chat Settings Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 ml-2">
              <ImageIcon size={20} className="text-blue-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider opacity-70">Chat Background</h2>
            </div>
            
            <div className="neu-flat rounded-3xl p-8 space-y-8">
              
              {/* Custom Upload */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-base font-bold opacity-80">Custom Wallpaper</span>
                  {chatBackground !== 'default' && !chatBackground.startsWith('#') && (
                    <button
                      onClick={handleRemoveBackground}
                      className="w-10 h-10 rounded-full neu-flat flex items-center justify-center text-red-500 hover:scale-105 active:scale-95 transition-all"
                      title="Remove Background"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full sm:w-auto px-8 py-4 rounded-xl neu-flat text-blue-500 font-bold hover:scale-105 active:neu-pressed transition-all flex items-center justify-center gap-3"
                  >
                    <ImageIcon size={20} /> Choose Image
                  </button>
                  
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  
                  {chatBackground !== 'default' && !chatBackground.startsWith('#') && (
                    <div className="h-28 w-full sm:w-48 rounded-xl neu-pressed p-2">
                      <div className="w-full h-full rounded-lg overflow-hidden relative">
                        <img src={chatBackground} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-blue-500/20 mix-blend-overlay"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full h-px bg-black/5 dark:bg-white/5 my-4"></div>

              <div>
                <span className="text-base font-bold opacity-80 block mb-5">Solid Colors</span>
                <div className="flex flex-wrap gap-5">
                  <button
                    onClick={() => handlePresetSelect('default')}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${chatBackground === 'default' ? 'neu-pressed text-blue-500' : 'neu-flat text-gray-400 hover:scale-110'}`}
                    title="Default Background"
                  >
                    DEF
                  </button>
                  {presetColors.map((color) => (
                    <div 
                      key={color}
                      className={`w-14 h-14 rounded-full p-1 transition-all duration-300 ${chatBackground === color ? 'neu-pressed' : 'neu-flat hover:scale-110'}`}
                    >
                      <button
                        onClick={() => handlePresetSelect(color)}
                        className="w-full h-full rounded-full shadow-inner"
                        style={{ backgroundColor: color }}
                        title={`Color ${color}`}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="w-full h-px bg-black/5 dark:bg-white/5 my-4"></div>

              <div>
                <span className="text-base font-bold opacity-80 block mb-5">Custom RGB Palette</span>
                <div className="flex gap-6 items-center">
                  <div className="flex flex-col items-center gap-2">
                    <label htmlFor="bg-color" className="text-xs font-semibold text-gray-500">Background</label>
                    <div className="relative w-14 h-14 rounded-full neu-flat overflow-hidden p-1">
                      <input 
                        id="bg-color"
                        type="color" 
                        value={chatBackground.startsWith('#') ? chatBackground : '#ffffff'}
                        onChange={(e) => setChatBackground(e.target.value)}
                        className="w-[150%] h-[150%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-2">
                    <label htmlFor="primary-color" className="text-xs font-semibold text-gray-500">Chat Bubbles</label>
                    <div className="relative w-14 h-14 rounded-full neu-flat overflow-hidden p-1">
                      <input 
                        id="primary-color"
                        type="color" 
                        value={useThemeStore.getState().primaryColor || '#b04f91'}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-[150%] h-[150%] absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </section>
        </div>
        </div>
      </motion.div>
    </>
  );
};

export default Setting;