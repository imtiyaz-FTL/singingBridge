

const axios = require("axios");
const querystring = require("querystring");
// Function to send OTP via message
const sendOTP = async (mobile, otp) => {
    const api_key = "5a841e9920248";
    const sender_id = "KOLBKS";
    const peid = "1001686750000016627";
    const templateid = "1007169354414125403";
    const message = `OTP for login is ${otp} and valid till 30 minutes.Do not share this OTP to anyone for security reasons. Kolbsk`

    const messageUrl = `http://sms.fusiontechlab.com/app/smsapi/index.php?key=${api_key}&type=text&contacts=${mobile}&senderid=${sender_id}&peid=${peid}&templateid=${templateid}&msg=${encodeURIComponent(message)}`; // Replace with your actual API endpoint

    const messageData = {
        api_key,
        sender_id,
        peid,
        templateid,
        message,
        phone: mobile, // Assuming your user model has a phone field
    };

    const encodedMessageData = querystring.stringify(messageData);
    // console.log(encodedMessageData, "hiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiiii")

    try {
        await axios(`http://sms.fusiontechlab.com/app/smsapi/index.php?key=${api_key}&type=text&contacts=${mobile}&senderid=${sender_id}&peid=${peid}&templateid=${templateid}&msg=OTP for login is ${otp} and valid till 30 minutes.Do not share this OTP to anyone for security reasons. Kolbsk
`, {
            method: "GET",
        })
            .then((res) => {
                console.log(res, "kkkkkkkkkkiiiiiiiiiiiiiiii")
            })
    } catch (error) {
        console.error("Error sending OTP:", error);
        throw new Error("An error occurred while sending the OTP.");
    }
};

module.exports = sendOTP

