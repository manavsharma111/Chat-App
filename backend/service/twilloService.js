const twilio = require('twilio')
const dotenv = require('dotenv')

// twillo data from env
dotenv.config()
const accountSid = process.env.TWILLO_ACCOUNT_SID
const authToken = process.env.TWILLO_AUTH_TOKEN
const twilloService = process.env.TWILLO_SERVICE

const client = twilio(accountSid, authToken)

// send otp to number
const sendOTP = async (phoneNumber) => {
    try{
        if(!phoneNumber) throw new Error('Phone number is required')
        
        const response = await client.verify.v2.services(twilloService).verifications.create({
            to: phoneNumber,
            channel: 'sms'       
        })
        console.log('this is my otp response',response)
        return response
    }
    catch(e){
        console.error(e)
        throw e // Re-throw the error
    }
}

// verification of otp
const verifyOTP = async (phoneNumber,otp) => {
    try{        
        const response = await client.verify.v2.services(twilloService).verificationChecks.create({
            to: phoneNumber,
            code: otp    
        })
        console.log('this is my otp response',response)
        return response
    }
    catch(e){
        console.error(e)
        throw e // Re-throw the error
    }
}

module.exports = { sendOTP, verifyOTP }
