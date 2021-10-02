const ErrorResponse = require('../error/ErrorResponse');
const ErrorCode = require('../error/ErrorCode');

const errorHandler = (err, req, res, next) => {
    if (err.type === 'entity.parse.failed') {
        // in case someone sends a malformed json body request
        err = new ErrorResponse(ErrorCode.BAD_REQUEST.status, ErrorCode.BAD_REQUEST.code, ErrorCode.BAD_REQUEST.message);
    }
    // we could also add some db connection errors logging for easier debugging, more detailed error logging if we wished
    if (!(err instanceof ErrorResponse)) {
        // if there is no custom error defined, we have an unknown internal server error
        err = new ErrorResponse(ErrorCode.UNKNOWN_ERROR.status, ErrorCode.UNKNOWN_ERROR.code, ErrorCode.UNKNOWN_ERROR.message);
        // normally here we should log somewhere the real cause of the error for bug tracing
        // ....
        // but ofc we don't want to return much server details to the client/users of the app
    }
    res.status(err.status).send(err);
}

module.exports = errorHandler;