const ErrorResponse = require('../error/ErrorResponse');
const ErrorCode = require('../error/ErrorCode');

// handles all unknown page received requests
exports.pageNotFound = (req, res, next) => {
    throw new ErrorResponse(ErrorCode.PAGE_NOT_FOUND.status, ErrorCode.PAGE_NOT_FOUND.code, ErrorCode.PAGE_NOT_FOUND.message);
}