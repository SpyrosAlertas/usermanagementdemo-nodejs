const express = require('express');
const router = express.Router();

const pageNotFound = require('../controllers/pageNotFound');

router
    // handle all remaining routes as 404 - page not found
    .route('*')
    .all(pageNotFound.pageNotFound);

module.exports = router;