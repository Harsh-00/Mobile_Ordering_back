const successResponse = (res, data={}, message = 'Success', statusCode = 200, extra={}) => {
    return res.status(statusCode).json({
        success: true,
        message,
        info: data,
        extra: extra
    });
};

const errorResponse = (res, error=null, message='Failed', statusCode = 500) => {
    console.log(error,message,statusCode);
    return res.status(statusCode).json({
        success: false,
        message: error?.message || message || 'Internal Server Error'
    });
};

module.exports = { successResponse, errorResponse };