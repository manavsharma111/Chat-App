const nodemailer = require('nodemailer')
const dotenv = require('dotenv')

dotenv.config()

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
})

transporter.verify((error,success) => {
    if(error){
        console.error(error)
    }
    else{
        console.log('ready for send otp to gmail')
    }   
}
)

const sendOtpToGmail = async (email, otp) => {
const html = `
    <div style="background-color: #f4f7f6; padding: 40px 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
      <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        
        <!-- Header -->
        <div style="background-color: #075e54; padding: 20px; text-align: center;">
          <h2 style="color: #ffffff; margin: 0; font-size: 24px;">ChatApp</h2>
        </div>

        <!-- Body -->
        <div style="padding: 40px 30px; text-align: center;">
          <h3 style="color: #333; margin-bottom: 20px;">Verify Your Account</h3>
          <p style="color: #555; font-size: 16px; margin-bottom: 30px;">
            Please use the following One-Time Password (OTP) to complete your verification process.
          </p>
          
          <div style="background-color: #f1f8e9; border: 1px dashed #075e54; padding: 15px; border-radius: 6px; display: inline-block;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #075e54;">
              ${otp}
            </span>
          </div>

          <p style="color: #888; font-size: 14px; margin-top: 30px;">
            This code is valid for <strong>5 minutes</strong>.<br/>
            For security, do not share this code with anyone.
          </p>
        </div>

        <!-- Footer -->
        <div style="background-color: #f9f9f9; padding: 20px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #777; font-size: 12px; margin: 0;">
            If you didn't request this, you can safely ignore this email.
          </p>
          <p style="color: #333; font-size: 13px; font-weight: bold; margin-top: 10px;">
            ChatApp By Manav Sharma
          </p>
        </div>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `ChatApp <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'OTP Verification',
    html: html
  })
}

module.exports = sendOtpToGmail
