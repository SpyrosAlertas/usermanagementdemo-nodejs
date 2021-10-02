require('dotenv').config();

const CustomErrors = {
    // generic errors
    UNKNOWN_ERROR: {
        status: 500, code: 'UNKNOWN_ERROR', message: 'Unknown Internal Server Error'
    },
    PAGE_NOT_FOUND: {
        status: 404, code: 'PAGE_NOT_FOUND', message: 'Page Not Found'
    },
    BAD_REQUEST: {
        status: 400, code: 'BAD_REQUEST', message: 'Bad Request'
    },
    // authentication/authorization errors
    UNAUTHENTICATED: {
        status: 401, code: 'NOT_AUTHENTICATED', message: 'You have to log in first'
    },
    UNAUTHORIZED: {
        status: 403, code: 'NOT_AUTHORIZED', message: 'You don\'t have permission for this action'
    },
    EXPIRED_TOKEN: {
        status: 401, code: 'EXPIRED_TOKEN', message: 'You have to log in again'
    },
    INVALID_TOKEN: {
        status: 400, code: 'INVALID_TOKEN', message: 'You have to log in first'
    },
    ACCOUNT_NOT_ENABLED: {
        status: 403, code: 'ACCOUNT_NOT_ENABLED', message: 'Your account is pending activation by admins. Try again later'
    },
    ACCOUNT_LOCKED: {
        status: 403, code: 'ACCOUNT_LOCKED', message: 'Your account has been locked due to many failed login attempts. Try again later'
    },
    BAD_CREDENTIALS: {
        status: 403, code: 'BAD_CREDENTIALS', message: 'User credentials are wrong (username or password)'
    },
    // profile image upload errors
    FILE_SIZE_LIMIT: {
        status: 400, code: 'FILE_SIZE_LIMIT', message: `Max file size exceeded the ${process.env.MAX_FILE_SIZE / 1_000_000}mb limit`
    },
    FILE_FORMAT_NOT_SUPPORTED: {
        status: 400, code: 'FILE_FORMAT_NOT_SUPPORTED', message: `Supported file formats are: ${JSON.parse(process.env.SUPPORTED_IMG_EXTS,
            (key, value) => {
                if (key != 0) value = ' ' + value;
                return value;
            }
        )}`
    },
    NO_FILE: {
        status: 400, code: 'NO_FILE', message: 'No file was sent to the server'
    },
    PROFILE_IMAGE_NOT_FOUND: {
        status: 404, code: 'PROFILE_IMAGE_NOT_FOUND', message: 'Profile image not found'
    },
    // user controller related errors
    USER_NOT_FOUND: {
        status: 404, code: 'USER_NOT_FOUND', message: 'No user was found with that username'
    },
    USERNAME_TAKEN: {
        status: 409, code: 'USERNAME_TAKEN', message: 'Username is already used by another user'
    },
    EMAIL_TAKEN: {
        status: 409, code: 'EMAIL_TAKEN', message: 'Email is already used by another user'
    }
}

module.exports = CustomErrors;