import axiosInstance from "./url.service"

// send otp api
export const sendOtp = async (phoneNumber, phoneSuffix, email) => {
    try{
        const response = await axiosInstance.post('/auth/send-otp', {
            phoneNumber,
            phoneSuffix,
            email
        })
        return response.data
    }
    catch(error){
       throw error.response ? error.response.data : error;
    }
}


// verify otp api
export const verifyOtp = async (phoneNumber, phoneSuffix, otp, email) => {
    try{
        const response = await axiosInstance.post('/auth/otp-verification', {
            phoneNumber,
            phoneSuffix,
            otp,
            email
        })
        return response.data
    }
    catch(error){
       throw error.response ? error.response.data : error;
    }
}


// update user profile
export const updateUserProfile = async (updateData) => {
    try{
        const response = await axiosInstance.put('/auth/update-profile', updateData)
        return response.data
    }
    catch(error){
        throw error.response ? error.response.data : error;
    }

}


// check auth
export const checkUserAuth = async () => {
    try{
        const response = await axiosInstance.get('/auth/check-auth')
        if(response.data.status?.toLowerCase() === 'success') {
            return {isAuthenticate:true, user: response.data.data?.user || response.data.user}
        } else {
            return {isAuthenticate:false, user:null}
        }
    }
    catch(error){
        throw error.response ? error.response.data : error;
    }
}


// logout user
export const logoutUser = async () => {
    try{
        const response = await axiosInstance.put('/auth/logout')
        return response.data
    }
    catch(error){
        throw error.response ? error.response.data : error;
    }

}


// get all users
export const getAllUsers = async () => {
    try{
        const response = await axiosInstance.get('/auth/get-all-user')
        return response.data
    }
    catch(error){
        throw error.response ? error.response.data : error;
    }

}