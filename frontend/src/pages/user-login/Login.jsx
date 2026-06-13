import React, { useState } from 'react'
import useLoginStore from '../../store/useLoginStore'
import useUserStore from '../../store/useUserStore'
import countries from '../../utils/countriles'
import * as Yup from 'yup'
import { BotMessageSquare, ChevronUp, ChevronDown, User } from 'lucide-react'
import { yupResolver } from '@hookform/resolvers/yup'
import { useForm } from 'react-hook-form'
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom'
import useThemeStore from '../../store/themeStore'
import BackgroundParticles from '../../store/BackgroundParticles'
import { motion } from 'framer-motion' // Import motion from framer-motion
import Spinner from '../../utils/Spinner.jsx'
import { ArrowLeft } from 'lucide-react'; // Import ArrowLeft icon
import axios from 'axios'; // Import axios
import { toast } from 'react-toastify';
import { sendOtp, verifyOtp } from '../../services/user.service.js';

const getFlagFromAlpha2 = (alpha2) => {
  if (!alpha2 || alpha2.length !== 2) return '???'
  return alpha2
    .toUpperCase()
    .split('')
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('')
}

const loginValidationSchema = Yup.object().shape({
  phoneNumber: Yup.string()
    .nullable()
    .notRequired()
    .test('is-digits', 'Phone Number must be digits', (value) => {
      if (!value) return true;
      return /^\d+$/.test(value);
    })
    .transform((value, originalValue) => ((originalValue || '').trim() === '' ? null : value)),
  email: Yup.string()
    .nullable()
    .notRequired()
    .email('Please enter valid Email')
    .transform((value, originalValue) => ((originalValue || '').trim() === '' ? null : value))
    .test('atleast one', 'Either Email or phone number is required', function (value) {
      const { phoneNumber } = this.parent
      return Boolean(value || phoneNumber)
    }),
})

const otpValidationSchema = Yup.object().shape({
  otp: Yup.string().length(6, 'OTP must be 6 digits').required('OTP is required'),
})

const profileValidationSchema = Yup.object().shape({
  username: Yup.string().required('username is required'),
  agreed: Yup.bool().oneOf([true], 'You must agree to the terms and conditions'),
})

const Login = () => {
  const { step, setStep, resetLoginState, userPhoneData, setUserPhoneData } = useLoginStore() // Destructure resetLoginState
  const [phoneNumber, setPhoneNumber] = useState('') // State for phone number input
  const [selectedCountry, setSelectedCountry] = useState(countries[0]) // Default to the first country
  const [email, setEmail] = useState('') // State for email input
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']); // OTP boxes state
  const otpRefs = useRef([]); // Refs for OTP boxes
  const [loading, setLoading] = useState(false) // Make loading state mutable
  const [showDropdown, setShowDropdown] = useState(false) // State for dropdown visibility
  const [searchTerm, setSearchTerm] = useState('')
  const [rememberMe, setRememberMe] = useState(true) // Default remember me to true
  const navigate = useNavigate()
  const { setUser } = useUserStore()

  const {
    register: loginRegister,
    handleSubmit: handkeLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm({
    resolver: yupResolver(loginValidationSchema),
  })

  const {
    register: otpRegister, // Register function for OTP form
    handleSubmit: handleOtpSubmit, // Handle submit function for OTP form
    formState: { errors: otpErrors }, // Errors for OTP form
  } = useForm({ resolver: yupResolver(otpValidationSchema) });

  const { theme } = useThemeStore()

  // Get user data from store to display in OTP step (user from useUserStore)
  const { user } = useUserStore();

  const filteredCountries = countries.filter(
    (country) => country.name.toLowerCase().includes(searchTerm.toLowerCase()) || country.dialCode.includes(searchTerm)
  )

  const onSubmitLogin = async (e) => {
    e.preventDefault();
    if (!phoneNumber && !email) {
      toast.error('Either Email or phone number is required');
      return;
    }
    if (phoneNumber && !/^\d+$/.test(phoneNumber)) {
      toast.error('Phone Number must be digits');
      return;
    }

    try {
      setLoading(true);
      let response;
      if (email) {
        response = await sendOtp(null, null, email)
        if (response.status?.toLowerCase() === "success") {
          toast.info('OTP sent successfully to your email!')
          setUserPhoneData({ email: email });
          setStep(2);
        } else {
          toast.error(response.message || 'Failed to send OTP to email.');
        }
      } else if (phoneNumber) {
        response = await sendOtp(phoneNumber, selectedCountry.dialCode, null)
        if (response.status?.toLowerCase() === 'success') {
          toast.info("Otp is sent successfully to phone number !!")
          setUserPhoneData({ phoneNumber: phoneNumber, phoneSuffix: selectedCountry.dialCode });
          setStep(2);
        }
        else {
          toast.error(response.message || 'Failed to send OTP to phone number.');
        }
      }
    } catch (error) {
      console.error('Failed to send OTP:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onSubmitOtp = async (e) => {
    if(e) e.preventDefault();
    const otpString = otpValues.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter a 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      if (!userPhoneData) throw new Error("User data not found.");

      let response;

      if (userPhoneData.email) {
        response = await verifyOtp(null, null, otpString, userPhoneData.email, rememberMe);
      } else if (userPhoneData.phoneNumber) {
        const fullPhoneNumber = userPhoneData.phoneSuffix + userPhoneData.phoneNumber;
        response = await verifyOtp(userPhoneData.phoneNumber, userPhoneData.phoneSuffix, otpString, null, rememberMe);
      } else {
        throw new Error("No phone number or email found for OTP verification.");
      }

      if (response.status?.toLowerCase() === 'success') {
        toast.success('OTP verified successfully!');
        const verifiedUser = response.data?.data?.user || response.data?.user;
        setUser(verifiedUser);
        resetLoginState();
        if (verifiedUser?.isProfileCompleted) {
          toast.success("Welcome back to ChatApp");
          navigate("/");
        }
        else navigate('/signup');
      } else {
        toast.error(response.message || 'Failed to verify OTP. Please try again.');
      }
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      let response;
      if (userPhoneData?.email) {
        response = await sendOtp(null, null, userPhoneData.email);
        if (response.status?.toLowerCase() === "success") {
          toast.info('OTP resent successfully to your email!');
        } else {
          toast.error(response.message || 'Failed to resend OTP to email.');
        }
      } else if (userPhoneData?.phoneNumber) {
        response = await sendOtp(userPhoneData.phoneNumber, userPhoneData.phoneSuffix, null);
        if (response.status?.toLowerCase() === 'success') {
          toast.info("OTP resent successfully to your phone!");
        } else {
          toast.error(response.message || 'Failed to resend OTP to phone.');
        }
      } else {
        toast.error("No email or phone number found to resend OTP.");
      }
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      toast.error(error?.response?.data?.message || error?.message || 'Failed to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (isNaN(value)) return;
    const newOtp = [...otpValues];
    // if pasting multiple characters in a single box (edge case)
    if (value.length > 1) {
       handleOtpPaste({ preventDefault: () => {}, clipboardData: { getData: () => value } });
       return;
    }
    newOtp[index] = value;
    setOtpValues(newOtp);

    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    if (pastedData.length === 0) return;
    
    const newOtp = [...otpValues];
    pastedData.forEach((char, index) => {
      newOtp[index] = char;
    });
    setOtpValues(newOtp);
    const focusIndex = Math.min(pastedData.length, 5);
    otpRefs.current[focusIndex]?.focus();
  };



  // Ref for the dropdown container
  const dropdownRef = useRef(null);

  // State for the OTP input, if you need to manage it manually for styling or focus
  // const [otpInput, setOtpInput] = useState(''); 

  // Effect to handle clicks outside the dropdown
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownRef]);
  return (
    <div
      className={`relative min-h-screen w-full overflow-x-hidden ${theme === 'dark'
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white'
          : 'bg-gradient-to-br from-sky-100 via-cyan-200 via-teal-200 to-emerald-200 text-gray-800'
        }`}
    >
      <div className="absolute inset-0 z-0">
        <BackgroundParticles role={theme === 'dark' ? 'candidate' : 'employer'} />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: -100, rotate: -360, scale: 0 }}
          animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
          transition={{ duration: 1.2, type: 'spring', ease: 'easeInOut', stiffness: 400, damping: 40 }}
          className={`${theme === 'dark' ? 'text-white bg-white/10 border-white/20' : 'bg-white/35 text-gray-800 border-white/50'
            } w-full max-w-lg p-6 md:p-8 rounded-3xl border shadow-[0_20px_80px_-20px_rgba(0,0,0,0.45)] backdrop-blur-2xl`}
        >
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 360 }}
            transition={{ type: 'spring', stiffness: 300, damping: 40 }}
            className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl mx-auto mb-5 flex items-center justify-center shadow-lg"
          >
            <BotMessageSquare size={46} color="#ffffff" strokeWidth={2.8} />
          </motion.div>

          <h1 className={`text-3xl font-bold text-center ${theme === 'dark' ? 'text-emerald-300' : 'text-slate-800'}`}>
            Chat App Login
          </h1>
          <p className={`mt-2 mb-5 text-center text-sm ${theme === 'dark' ? 'text-slate-200/90' : 'text-slate-600'}`}>
            Secure sign in with OTP or email
          </p>
          <ProgressBar theme={theme} step={step} />
          {/* {error && <p className="text-red-500 text-center mb-4">{error}</p>} */}

          {step === 1 && (
            <form className="space-y-5">
              <p className={`text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>Enter your phone number to get OTP.</p>

              <div className="relative" >
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center w-full gap-2">
                  <div className="relative w-full sm:w-auto" ref={dropdownRef}>
                    <button
                      type="button"
                      onClick={() => setShowDropdown((prev) => !prev)}
                      className={`w-full sm:w-28 py-3 px-3 text-sm font-medium flex items-center justify-between ${theme === 'dark' ? 'text-white bg-slate-800/90 border-slate-500' : 'text-gray-900 bg-white/90 border-slate-300'
                        } border rounded-xl focus:ring-2 focus:ring-emerald-300 focus:outline-none`}
                    >
                      <span>{getFlagFromAlpha2(selectedCountry.alpha2)} {selectedCountry.dialCode}</span>
                      <motion.span
                        animate={{ rotate: showDropdown ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <ChevronUp />
                      </motion.span>
                    </button>

                    {showDropdown && (
                      <div
                        className={`absolute z-20 bottom-full mb-2 w-72 border rounded-2xl shadow-2xl ${theme === 'dark' ? 'bg-slate-800/95 border-slate-500' : 'bg-white/95 border-slate-300'
                          } backdrop-blur-xl`}
                      >
                        <div
                          className="p-2">
                          <input
                            type="text"
                            placeholder="Search by country or dial code"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full py-2 px-3 text-sm ${theme === 'dark'
                                ? 'text-white bg-slate-700 border-slate-500 placeholder:text-gray-400'
                                : 'text-gray-900 bg-white border-slate-300 placeholder:text-gray-500'
                              } border rounded-xl focus:ring-2 focus:ring-emerald-300 focus:outline-none`}
                          />
                        </div>

                        <div className="max-h-56 overflow-y-auto pb-1">
                          {filteredCountries.map((country, index) => (
                            <button
                              key={`${country.alpha2}-${country.dialCode}-${index}`}
                              type="button"
                              onClick={() => {
                                setSelectedCountry(country)
                                setShowDropdown(false)
                              }}
                              className={`w-full text-left px-3 py-2 text-sm ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                            >
                              {getFlagFromAlpha2(country.alpha2)} {country.name} ({country.dialCode})
                            </button>
                          ))}
                          {filteredCountries.length === 0 && (
                            <p className={`px-3 py-2 text-xs ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                              No matching country found
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="Phone Number"
                    className={`w-full sm:flex-1 min-w-0 py-3 px-4 text-sm ${theme === 'dark' ? 'text-white bg-slate-800/90 border-slate-500' : 'text-gray-900 bg-white/90 border-slate-300'
                      } border rounded-xl focus:ring-2 focus:ring-emerald-300 focus:outline-none`}
                  />
                </div>
                {loginErrors.phoneNumber && <p className="text-red-500 text-xs mt-1">{loginErrors.phoneNumber.message}</p>}
              </div>

              <div className="flex items-center my-1">
                <div className={`grow h-px ${theme === 'dark' ? 'bg-slate-500/70' : 'bg-slate-300'}`} />
                <span className={`mx-3 text-xs tracking-widest ${theme === 'dark' ? 'text-slate-300' : 'text-slate-500'}`}>OR</span>
                <div className={`grow h-px ${theme === 'dark' ? 'bg-slate-500/70' : 'bg-slate-300'}`} />
              </div>

              <div
                className={`flex items-center border rounded-xl px-3 py-1 ${theme === 'dark' ? 'text-white bg-slate-800/90 border-slate-500' : 'text-gray-900 bg-white/90 border-slate-300'
                  }`}
              >
                <User className={`mr-2 ${theme === 'dark' ? 'text-white' : 'text-gray-600'}`} size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (optional)"
                  className="w-full min-w-0 py-2 px-1 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none"
                />
              </div>
              {loginErrors.email && <p className="text-red-500 text-xs mt-1">{loginErrors.email.message}</p>}

              <button
                type="button"
                onClick={onSubmitLogin}
                // className="w-full flex items-center justify-center py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg"
                className="
w-full py-3 rounded-2xl cursor-pointer
relative overflow-hidden isolate

text-gray-600 

font-semibold tracking-wide

bg-linear-to-r from-yellow-300 to-orange-300

backdrop-blur-xl
border border-white/20

shadow-[0_8px_32px_rgba(0,0,0,0.18)]

before:content-['']
before:absolute before:inset-0
before:bg-linear-to-t
before:from-white
before:to-gray-200


before:translate-y-full
before:transition-transform
before:duration-500
before:ease-[cubic-bezier(0.22,1,0.36,1)]

before:-z-10

hover:before:translate-y-0
hover:border-orange-300
hover:shadow-[0_10px_40px_rgba(251,146,60,0.35)]

transition-all duration-300
"
              >
                {loading ? <Spinner size="small" color="light" /> : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form className="space-y-5" onSubmit={onSubmitOtp}>
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)} // Go back to step 1
                  className={`p-2 rounded-full ${theme === 'dark' ? 'text-white hover:bg-slate-700' : 'text-gray-700 hover:bg-gray-100'}`}
                  aria-label="Go back"
                >
                  <ArrowLeft size={20} />
                </button>
              </div>
              <p className={`text-center ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Enter the 6-digit OTP sent to {userPhoneData?.phoneNumber || userPhoneData?.email}.
              </p>
              
              <div className="flex justify-center gap-2 sm:gap-3 py-4">
                {otpValues.map((value, index) => (
                  <input
                    key={index}
                    type="text"
                    inputMode="numeric"
                    maxLength="1"
                    value={value}
                    ref={(el) => (otpRefs.current[index] = el)}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-xl border ${
                      theme === 'dark' 
                        ? 'text-white bg-slate-800/90 border-slate-500 focus:ring-emerald-400' 
                        : 'text-gray-900 bg-white/90 border-slate-300 focus:ring-emerald-500'
                    } focus:ring-2 focus:outline-none transition-all duration-200 shadow-inner`}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between py-2">
                <label className={`flex items-center space-x-2 text-sm cursor-pointer select-none ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span>Remember me on this device</span>
                </label>
              </div>

              <button
                type="button"
                onClick={onSubmitOtp}
                className="w-full py-3 rounded-2xl cursor-pointer relative overflow-hidden isolate text-gray-600 font-semibold tracking-wide bg-linear-to-r from-yellow-300 to-orange-300 backdrop-blur-xl border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.18)] before:content-[''] before:absolute before:inset-0 before:bg-linear-to-t before:from-white before:to-gray-200 before:translate-y-full before:transition-transform before:duration-500 before:ease-[cubic-bezier(0.22,1,0.36,1)] before:-z-10 hover:before:translate-y-0 hover:border-orange-300 hover:shadow-[0_10px_40px_rgba(251,146,60,0.35)] transition-all duration-300"
              >
                {loading ? <Spinner size="small" color="light" /> : 'Verify OTP'}
              </button>
              <p className={`text-center text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Didn't receive OTP? <span onClick={handleResendOtp} className="text-emerald-500 cursor-pointer hover:underline">Resend OTP</span>
              </p>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Login

const ProgressBar = ({ theme, step }) => {
  return (
    <div className={`w-full ${theme === 'dark' ? 'bg-slate-600/60' : 'bg-slate-300'} rounded-full h-2.5 mb-6`}>
      <div
        className="bg-linear-to-r from-pink-400 to-rose-400 h-2.5 rounded-full transition-all duration-500 ease-in-out"
        style={{ width: `${(step / 2) * 100}%` }}
      ></div>
    </div>
  )
}
