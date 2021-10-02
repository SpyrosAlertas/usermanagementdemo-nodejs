// User authentication & authorization middleware

const jwt = require('jsonwebtoken');

const ErrorResponse = require('../error/ErrorResponse');
const ErrorCode = require('../error/ErrorCode');

// middleware that checks if users is authenticated/logged in (in other words has provided a valid, non expired jwt in this case)
module.exports.isLoggedIn = (req, res, next) => {

    req.body.jwtDecoded = undefined;

    // get token from header and remove the 'Bearer ' part for token validation
    let token = req.header(process.env.TOKEN_HEADER);
    if (token === undefined) {
        // if no Authorization token is received user is definitely not logged in
        throw new ErrorResponse(ErrorCode.UNAUTHENTICATED.status, ErrorCode.UNAUTHENTICATED.code, ErrorCode.UNAUTHENTICATED.message);
    }

    const opts = { issuer: process.env.TOKEN_ISSUER, audience: process.env.TOKEN_AUDIENCE }

    // otherwise extract token from request header
    token = token.substring(process.env.TOKEN_PREFIX.length);

    // check if user can be authenticated with received token (token may be fake or expired or whatever not a legit token)
    jwt.verify(token, process.env.TOKEN_SECRET_KEY, opts, (err, decoded) => {
        if (err) {
            if (err.name === 'TokenExpiredError') {
                // when sent token has expired
                throw new ErrorResponse(ErrorCode.EXPIRED_TOKEN.status, ErrorCode.EXPIRED_TOKEN.code, ErrorCode.EXPIRED_TOKEN.message);
            } else {
                // when token is not valid for a number of reasons (like malformed jwt, missing/inalid signature, etc..)
                throw new ErrorResponse(ErrorCode.INVALID_TOKEN.status, ErrorCode.INVALID_TOKEN.code, ErrorCode.INVALID_TOKEN.message);
            }
        }
        // if user is authenticated successfully - store decoded token in request body
        // we do this so we don't have to decode the jwt in all other middleware that may need it after this
        req.body.jwtDecoded = decoded;
        // proceed to the next middleware/callback
        next();
    });

}

// middleware that checks if user tries to perform action on his own user data or someone elses
module.exports.isSelf = (req, res, next) => {
    if (req.body.jwtDecoded.sub !== req.params.username) {
        // if user is not self, he is not authorized to perform requested action, throw relevant error
        throw new ErrorResponse(ErrorCode.UNAUTHORIZED.status, ErrorCode.UNAUTHORIZED.code, ErrorCode.UNAUTHORIZED.message);
    }
    // else if user isSelf, proceed to the next middleware/callback
    next();
}

// middleware that checks if user is admin
module.exports.isAdmin = (req, res, next) => {
    if (req.body.jwtDecoded.role !== 'ADMIN') {
        // if user is not admin, he is not authorized to perform requested action, throw relevant error
        throw new ErrorResponse(ErrorCode.UNAUTHORIZED.status, ErrorCode.UNAUTHORIZED.code, ErrorCode.UNAUTHORIZED.message);
    }
    // else if user has admin role proceed to the next middleware/callback
    next();
}

// middleware that checks if user tries to perform action on his own user data or someone elses or if he is an admin
module.exports.isSelfOrAdmin = (req, res, next) => {
    if (!(req.body.jwtDecoded.sub === req.params.username) && !(req.body.jwtDecoded.role === 'ADMIN')) {
        // if user is not self and user is not admin, he is not authorized to perform requested action, throw relevant error
        throw new ErrorResponse(ErrorCode.UNAUTHORIZED.status, ErrorCode.UNAUTHORIZED.code, ErrorCode.UNAUTHORIZED.message);
    }
    // else if user isSelf or user isAdmin, proceed to the next middleware/callback
    next();
}