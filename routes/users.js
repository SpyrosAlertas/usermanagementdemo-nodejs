const express = require('express');
const router = express.Router();

const catchAsync = require('../error/catchAsync');
const users = require('../controllers/users');
const { isLoggedIn, isSelf, isAdmin, isSelfOrAdmin } = require('../middleware/auth');

router.route('')
    // register new user route (create)
    // anyone can register
    .post(catchAsync(users.create))
    // list all users route (read)
    // only admins can get a list of all users
    .get(isLoggedIn, isAdmin, catchAsync(users.findAll));

router.route('/login')
    // login user route (update)
    // anyone can try to log in
    .post(catchAsync(users.login));

router.route('/search')
    // list all users filtered route (read)
    // only admins can get a list of all users
    .post(isLoggedIn, isAdmin, catchAsync(users.findAll));

router.route('/:username')
    // get user by username route (read)
    // admins can view any users profile and users can view their own profiles only
    .get(isLoggedIn, isSelfOrAdmin, catchAsync(users.findByUsername))
    // update user (update)
    // a user can update only his own data
    .put(isLoggedIn, isSelf, catchAsync(users.updateByUsername))
    // delete user (delete)
    // a user can delete his own profile or an admin can delete anyones profile
    .delete(isLoggedIn, isSelfOrAdmin, catchAsync(users.deleteByUsername));

router.route('/:username/activate')
    // activate user account (update)
    // admins can activate user accounts
    .put(isLoggedIn, isAdmin, catchAsync(users.activate));

// handle profile image actions (download/upload/delete)

router.route('/:username/profileImage')
    // download users profile image
    // any logged in user can download any users profile image
    .get(isLoggedIn, users.profileImageDownload)
    // update/upload users profile image (upload)
    // a user can update only his own profile image
    .put(isLoggedIn, isSelf, users.profileImageUpload)
    // delete users profile image (delete)
    // a user can delete only his own profile image but an admin can delete anyones profile image (in case it's inappropriate)
    .delete(isLoggedIn, isSelfOrAdmin, users.profileImageDelete);

module.exports = router;