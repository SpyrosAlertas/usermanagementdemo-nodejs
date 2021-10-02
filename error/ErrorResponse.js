class ErrorResponse extends Error {

    constructor(status, code, message) {
        super();
        this.status = status;           // http error status code
        this.code = code;               // client specific error code (enum)
        this.message = message;         // human readable short description of error
        this.timestamp = new Date();    // timestamp when error occured
    }

}

module.exports = ErrorResponse;