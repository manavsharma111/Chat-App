
const response = (res, statusCode, message, data = null) => {
    if (!res) {
        console.error('Response object is undefined')
        return
    }

    const responseObject = {
        // Checks if code starts with 2xx or 3xx
        status: statusCode < 400 ? 'Success' : 'Failure',
        message,
        data
    }

    return res.status(statusCode).json(responseObject)
}

module.exports = response
