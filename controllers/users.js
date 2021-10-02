const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');

const { User } = require('../config/database');
require('../config/profileImage');

const ErrorResponse = require('../error/ErrorResponse');
const ErrorCode = require('../error/ErrorCode');

// register new user (create)
exports.create = async (req, res, next) => {

    if (!('password' in req.body) || req.body.password.length < 2) {
        // if there is no password, it's a bad request, need to check it else bcrypt throws error
        // and if we don't throw this type of error, client will get a server internal error which will be misleading to the readl cause
        // also check if password length is at least two characters long
        // we could add much more complicated password strength logic here
        throw new ErrorResponse(ErrorCode.BAD_REQUEST.status, ErrorCode.BAD_REQUEST.code, ErrorCode.BAD_REQUEST.message);
    }

    const user = {
        username: req.body.username?.trim(),
        password: await bcrypt.hash(req.body.password, 10),
        isEnabled: false,
        isNonLocked: true,
        role: 'USER',
        firstName: req.body.firstName?.trim(),
        lastName: req.body.lastName?.trim(),
        email: req.body.email?.toLowerCase().trim(),
        phone: req.body.phone,
        country: req.body.country?.trim(),
        city: req.body.city?.trim(),
        address: req.body.address?.trim(),
        joinDate: new Date(),
        lastLoginAttemptDate: new Date(),
        failedLoginAttempts: 0
    }

    User.create(user)
        .then(u => {
            // user registered successfully
            res.status(201).send();
        }).catch(err => {
            let error = undefined;
            if (err.errors && err.errors[0].path === 'user.username_UNIQUE' && err.errors[0].validatorKey === 'not_unique') {
                // if username is already used by someone else
                error = new ErrorResponse(ErrorCode.USERNAME_TAKEN.status, ErrorCode.USERNAME_TAKEN.code, `Username ${user.username} already used by another user.`);
            } else if (err.errors && err.errors[0].path === 'user.email_UNIQUE' && err.errors[0].validatorKey === 'not_unique') {
                // if email is already used by someone else
                error = new ErrorResponse(ErrorCode.EMAIL_TAKEN.status, ErrorCode.EMAIL_TAKEN.code, `Email ${req.body.email} already used by another user.`);
            } else {
                // generic error message to malformed incoming requests
                error = new ErrorResponse(ErrorCode.BAD_REQUEST.status, ErrorCode.BAD_REQUEST.code, ErrorCode.BAD_REQUEST.message);
            }
            // next passes the error to error handler
            next(error);
        });

    // code execution continues till the end, but server has already responded to the client in case of success/error

    // another way to do this is to define let error  = undefined just before User.create(user)....
    // but with await in front, and immediately after the user.create we can check if there was an error or no,
    // if there was we throw the error, else we do nothing.

}

// list all users (read)
exports.findAll = async (req, res, next) => {
    // page number query parameter - or default (0) value
    if (!req.query.page || isNaN(req.query.page) || req.query.page < 0) {
        // if no page is given in query params, or is not a number, or is a negative number use 0 value
        req.query.page = 0;
    }
    // sort query parameter - or default value
    const sortFields = ['username', 'isEnabled', 'isNonLocked', 'role', 'joinDate'];
    if (!req.query.sort || !sortFields.includes(req.query.sort)) {
        req.query.sort = process.env.DEFAULT_SORT_FIELD;
    }
    // order query parameter - or default value
    if (!req.query.order || (req.query.order.toLowerCase() !== 'asc' && req.query.order.toLowerCase() !== 'desc')) {
        req.query.order = process.env.DEFAULT_ORDER
    }
    // pagesize query parameter - or default value
    if (!req.query.pagesize || isNaN(req.query.pagesize) || req.query.pagesize < 0) {
        req.query.pagesize = process.env.PAGE_DEFAULT_SIZE;
    }

    // parse filter options
    if (!req.body.username) {
        req.body.username = '';
    }

    if (req.body.isEnabled === 'true') req.body.isEnabled = true;
    if (req.body.isEnabled === 'false') req.body.isEnabled = false;
    if (req.body.isEnabled !== true && req.body.isEnabled !== false) {
        req.body.isEnabled = undefined;
    }

    if (req.body.isNonLocked === 'true') req.body.isNonLocked = true;
    if (req.body.isNonLocked === 'false') req.body.isNonLocked = false;
    if (req.body.isNonLocked !== true && req.body.isNonLocked !== false) {
        req.body.isNonLocked = undefined;
    }

    if (req.body?.role !== undefined) {
        if (req.body.role === null || !['ADMIN', 'USER'].includes(req.body.role.toUpperCase())) {
            req.body.role = undefined;
        }
    }

    let startDate = undefined;
    let endDate = undefined;
    startDate = new Date(req.body.startDate);
    if (req.body.startDate === null || startDate.toString() === 'Invalid Date') {
        // if start date was invalid
        startDate = undefined;
    }

    if (startDate instanceof Date) {
        startDate = new Date(startDate.toDateString());
        // if start date was a valid date
        endDate = new Date(req.body.endDate);
        if (req.body.endDate === null || endDate.toString() === 'Invalid Date') {
            // if end date was invalid
            endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1);
            endDate.setMilliseconds(endDate.getMilliseconds() - 1);
        } else {
            // if end date was valid, add 1 day, and remove 1 millisecond, to catch the whole last day
            endDate.setDate(endDate.getDate() + 1);
            endDate.setMilliseconds(endDate.getMilliseconds() - 1);
        }
    }

    const users = await User.scope('loginAttempts', 'brief').findAndCountAll({
        where: {
            username: { [Op.like]: ['%' + req.body.username + '%'] },
            isEnabled: req.body.isEnabled !== undefined ? req.body.isEnabled : { [Op.like]: ['%'] },
            isNonLocked: req.body.isNonLocked !== undefined ? req.body.isNonLocked : { [Op.like]: ['%'] },
            role: req.body.role !== undefined ? req.body.role : { [Op.like]: ['%'] },
            [Op.and]: [
                startDate && { joinDate: { [Op.between]: [startDate, endDate] } }
            ]
        },
        order: [[req.query.sort, req.query.order], ['username', 'asc']],
        limit: parseInt(req.query.pagesize),
        offset: parseInt(req.query.page) * req.query.pagesize
    });

    // Array to store the usernames of the accounts we have to unlock - we know usernames have to be unique
    const userAccountsToUnlock = [];

    users.rows.map(user => {
        // For every user we see check which accounts were previously
        // locked - and unlock those which lock period has passed
        const timePassed = new Date() - user.dataValues.lastLoginAttemptDate;
        if (!user.isNonLocked && timePassed > process.env.ACCOUNT_UNLOCK_TIME) {
            user.dataValues.isNonLocked = true;
            userAccountsToUnlock.push(user.dataValues.username);
        }
        delete user.dataValues.lastLoginAttemptDate;
        delete user.dataValues.failedLoginAttempts;
        return user;
    });

    // Save update in database for unlocked accounts
    User.update({ isNonLocked: true }, { where: { username: userAccountsToUnlock } });

    res.status(200).send(users);
}

// login user route (update)
exports.login = async (req, res, next) => {

    const { username, password } = req.body;

    if (!username || !password) {
        // if username or password is not sent return error
        throw new ErrorResponse(ErrorCode.BAD_REQUEST.status, ErrorCode.BAD_REQUEST.code, ErrorCode.BAD_REQUEST.message);
    }

    const options = { issuer: process.env.TOKEN_ISSUER, audience: process.env.TOKEN_AUDIENCE, expiresIn: process.env.TOKEN_EXPIRES_IN, algorithm: 'HS256' }

    // find requested user
    const user = await User.scope('pk', 'loginAttempts', 'detailed').findOne({ where: { username: username } });

    const timePassed = new Date() - user?.lastLoginAttemptDate;
    if (user && (await bcrypt.compare(password, user.password))) {
        if (!user.isEnabled) {
            // if users account is not enabled yet by admins, he can't login
            throw new ErrorResponse(ErrorCode.ACCOUNT_NOT_ENABLED.status, ErrorCode.ACCOUNT_NOT_ENABLED.code, ErrorCode.ACCOUNT_NOT_ENABLED.message);
        }
        else if (!user.isNonLocked && timePassed < process.env.FAILED_ATTEMPTS_PERIOD) {
            // if users account has been locked (due to many quick failed login attempts), he can't login temporarily
            // unless safety time period has passed so his account is 'unlocked' again
            throw new ErrorResponse(ErrorCode.ACCOUNT_LOCKED.status, ErrorCode.ACCOUNT_LOCKED.code, ErrorCode.ACCOUNT_LOCKED.message);
        } else {
            // if user is found and successfully authenticated create and add in header the authentication jwt
            const role = user.role;
            const token = jwt.sign(
                { sub: username, role },
                process.env.TOKEN_SECRET_KEY,
                options
            );
            res.setHeader(process.env.TOKEN_HEADER, `${process.env.TOKEN_PREFIX}${token}`);
            // update users last login date/time;
            user.lastLoginDate = new Date();
            user.failedLoginAttempts = 0;
            user.isNonLocked = true;
            user.save().then(() => {
                delete user.dataValues.userId;
                delete user.dataValues.password;
                delete user.dataValues.failedLoginAttempts;
                delete user.dataValues.lastLoginAttemptDate;
                res.status(200).send(user);
            });
        }
    } else {
        // if username or password is wrong return a generic username/password error
        if (user) {
            // if username is correct but password is wrong
            user.lastLoginAttemptDate = new Date();
            if (timePassed < process.env.FAILED_ATTEMPTS_PERIOD) {
                user.failedLoginAttempts += 1;
                if (user.failedLoginAttempts >= process.env.FAILED_ATTEMPTS_ALLOWED) {
                    // if user exceeded number of allowed failed attempts in a certain time period, lock his account
                    user.isNonLocked = false;
                }
            } else {
                // if safety time period has passed but user hasn't succesfully logged in before,
                // still unlock his account and give him again shots to try to log in resetting his login attempts.
                user.isNonLocked = true;
                user.failedLoginAttempts = 1;
            }
            user.save();
        }
        if (!user || user.isNonLocked)
            // if user doesn't exist or account is still unlocked
            throw new ErrorResponse(ErrorCode.BAD_CREDENTIALS.status, ErrorCode.BAD_CREDENTIALS.code, ErrorCode.BAD_CREDENTIALS.message);
        else
            // if user has locked his account due to many failed logged in attempts
            throw new ErrorResponse(ErrorCode.ACCOUNT_LOCKED.status, ErrorCode.ACCOUNT_LOCKED.code, ErrorCode.ACCOUNT_LOCKED.message);
    }

}

// get user by username (read)
exports.findByUsername = async (req, res, next) => {
    const user = await User.scope('detailed').findOne({ where: { username: req.params.username } });
    if (user === null) {
        // if user was not found
        throw new ErrorResponse(ErrorCode.USER_NOT_FOUND.status, ErrorCode.USER_NOT_FOUND.code, `No User with username '${req.params.username}' was found`);
    } else {
        const timePassed = new Date() - user?.lastLoginAttemptDate;
        if (timePassed > process.env.ACCOUNT_UNLOCK_TIME) {
            user.isNonLocked = true;
            await User.update({ isNonLocked: true }, { where: { username: user.username } });
        }
        delete user.dataValues.lastLoginAttemptDate;
        // if user was found
        res.status(200).send(user);
    }
}

// update user (update)
exports.updateByUsername = async (req, res, next) => {

    const user = await User.scope(['pk', 'detailed']).findOne({ where: { username: req.params.username } });
    if (user === null) {
        // user not found - can't update - this may happen only if a user has
        // a valid token, deletes his account and then tries to update his profile
        // with the token he had before account deletion
        throw new ErrorResponse(ErrorCode.USER_NOT_FOUND.status, ErrorCode.USER_NOT_FOUND.code, `No User with username '${req.params.username}' was found to update`);
    }

    // update values only for fields user send data, else keep the old ones
    if (req.body.password) {
        user.password = await bcrypt.hash(req.body.password, 10);
    }
    if (req.body.firstName) {
        user.firstName = req.body.firstName;
    }
    if (req.body.lastName) {
        user.lastName = req.body.lastName;
    }
    if (req.body.email) {
        // check if email has already been used
        const tmpUser = await User.scope(['pk', 'detailed']).findOne({ where: { email: req.body.email } });
        if (tmpUser && tmpUser.username !== user.username) {
            // if updated email is used by someone else, stop updating user details and send error response
            throw new ErrorResponse(ErrorCode.EMAIL_TAKEN.status, ErrorCode.EMAIL_TAKEN.code, `Email ${req.body.email} already used by another user.`);
        }
        user.email = req.body.email;
    }

    // the value of the below fields become null if user sent no value
    req.body.phone ? user.phone = req.body.phone : user.phone = null;
    req.body.country ? user.country = req.body.country : user.country = null;
    req.body.city ? user.city = req.body.city : user.city = null;
    req.body.address ? user.address = req.body.address : user.address = null;

    // try updating user
    user.save()
        .then(u => {
            // successfully updated user
            // delete fields we don't want to send back to the user (user_id and hashed password)
            delete u.dataValues.userId;
            delete u.dataValues.password;
            res.status(200).send(u);
        })
        .catch(err => {
            // something went wrong updating user profile data
            // in case received data don't satisfy validations/constraints
            let error = new ErrorResponse(ErrorCode.BAD_REQUEST.status, ErrorCode.BAD_REQUEST.code, ErrorCode.BAD_REQUEST.message);
            next(error);
        });

}

// delete user (delete)
exports.deleteByUsername = async (req, res, next) => {
    // Try to delete user, if he exists in our database
    const rows = await User.destroy({ where: { username: req.params.username } });
    if (rows === 0) {
        // if the user to delete doesn't exist in database
        throw new ErrorResponse(ErrorCode.USER_NOT_FOUND.status, ErrorCode.USER_NOT_FOUND.code, `No User with username '${req.params.username}' was found to delete`);
    } else {
        // if user exists delete his profile image if any
        profileImageDelete(req, res, next);
        // and response with http status 204 ok, no content
        res.status(204).send();
    }
}

// activate users account (update)
exports.activate = async (req, res, next) => {
    const user = await User.scope(['pk', 'detailed']).findOne({ where: { username: req.params.username } });
    if (user === null) {
        // if user wasn't found
        throw new ErrorResponse(ErrorCode.USER_NOT_FOUND.status, ErrorCode.USER_NOT_FOUND.code, `No User with username '${req.params.username}' was found to activate`);
    }
    // else if user was found, enable his account and save update in database
    user.isEnabled = true;
    user.save().then(() => {
        res.status(204).send();
    });
}

// handle profile image actions (download/upload/delete)

// get/download profile image (download)
exports.profileImageDownload = (req, res, next) => {
    // we don't check if user actually exists in db, we could have and get a users
    // profile image even his account doesn't exist, which normally would never happen though
    const imageExtsSupported = JSON.parse(process.env.SUPPORTED_IMG_EXTS);
    for (const ext of imageExtsSupported) {
        const filepath = path.join(path.dirname(require.main.filename), process.env.IMAGES_FOLDER_NAME, req.params.username + '.' + ext);
        if (fs.existsSync(filepath)) {
            // profile image found, send it to client
            res.status(200).download(filepath);
            // stop method execution
            return;
        }
    }
    // if user has no profile image, respond with a 204 http status code - ok, no content
    res.status(204).send();
}

// update/upload users profile image (upload)
exports.profileImageUpload = (req, res, next) => {

    upload(req, res, (err) => {
        try {
            if (err) {
                // order of how errors are handled matters! change with caution
                if (err.code === 'LIMIT_FILE_SIZE') {
                    // if allowed file size has been exceeded
                    throw new ErrorResponse(ErrorCode.FILE_SIZE_LIMIT.status, ErrorCode.FILE_SIZE_LIMIT.code, ErrorCode.FILE_SIZE_LIMIT.message);
                } else if (err.code == 'FILE_FORMAT_NOT_SUPPORTED') {
                    // file format is not supported
                    throw new ErrorResponse(ErrorCode.FILE_FORMAT_NOT_SUPPORTED.status, ErrorCode.FILE_FORMAT_NOT_SUPPORTED.code, ErrorCode.FILE_FORMAT_NOT_SUPPORTED.message);
                } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                    // bad request received, field with profile image should be named 'profileImage' - send no file received
                    throw new ErrorResponse(ErrorCode.NO_FILE.status, ErrorCode.NO_FILE.code, ErrorCode.NO_FILE.message);
                } else {
                    // in case some other unknown error occurs
                    throw new ErrorResponse(ErrorCode.UNKNOWN_ERROR.status, ErrorCode.UNKNOWN_ERROR.code, ErrorCode.UNKNOWN_ERROR.message);
                }
            } else if (!req.file) {
                // no file was sent to server
                throw new ErrorResponse(ErrorCode.NO_FILE.status, ErrorCode.NO_FILE.code, ErrorCode.NO_FILE.message);
            }

            // everything went ok, upload new profile image and send 204 http status response
            const imageExtsSupported = JSON.parse(process.env.SUPPORTED_IMG_EXTS);

            // remove old profile image if any
            imageExtsSupported.forEach(ext => {
                const filepath = path.join(path.dirname(require.main.filename), process.env.IMAGES_FOLDER_NAME, req.params.username + '.' + ext);
                fs.unlink(filepath, () => { });
            });

            // move/rename tmp image as users profile image now
            imageExtsSupported.forEach(ext => {
                const filepathTmp = path.join(path.dirname(require.main.filename), process.env.IMAGES_FOLDER_NAME, req.params.username + '_tmp.' + ext);
                const filepath = path.join(path.dirname(require.main.filename), process.env.IMAGES_FOLDER_NAME, req.params.username + '.' + ext);
                fs.rename(filepathTmp, filepath, () => { });
            });

            res.status(204).send();

        } catch (e) {
            next(e);
        }
    });

}

// delete users profile image (delete)
exports.profileImageDelete = (req, res, next) => {
    if (!profileImageDelete(req, res, next)) {
        // if there was no profile image to delete
        throw new ErrorResponse(ErrorCode.PROFILE_IMAGE_NOT_FOUND.status, ErrorCode.PROFILE_IMAGE_NOT_FOUND.code, ErrorCode.PROFILE_IMAGE_NOT_FOUND.message);
    }
    res.status(204).send();
}

// private helper methods

// deletes users profile image, doesn't respond with http status, meant to be used by other functions in this file only
profileImageDelete = (req, res, next) => {
    let profileImageDeleted = false;
    const imageExtsSupported = JSON.parse(process.env.SUPPORTED_IMG_EXTS);
    imageExtsSupported.forEach(ext => {
        const filepath = path.join(path.dirname(require.main.filename), process.env.IMAGES_FOLDER_NAME, req.params.username + '.' + ext);
        if (fs.existsSync(filepath)) {
            // check if file image exists and delete it
            profileImageDeleted = true;
            fs.unlink(filepath, () => { });
        }
    });
    // return whether a profile image was actually deleted or not
    return profileImageDeleted;
}

// In update and activate user methods we could use an update statement, one query instead
// of two queries but i did it with two queries (find one and then save) to keep it 100%
// same results with Spring Boot Version (otherwise we would have to do it with two queries
// in Spring Boot)
// This is because Sequelize doesn't update the database if there is no actuall change in
// the values and returns 0 if a user exists but there is no real change to it.
// However in Springs JpaRepository if we update a user, and the user exists even if no value
// actually changes, it returns the number of the rows that satisfy the where clause and not
// the ones that where actually updated