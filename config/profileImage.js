// profile image upload - save temporal file and see for actions later
const mime = require('mime-types');
const path = require('path');
const multer = require('multer');

module.exports = storage = multer.diskStorage({
    destination: function (req, res, cb) {
        cb(null, path.join(path.dirname(require.main.filename), process.env.IMAGES_FOLDER_NAME));
    },
    filename: function (req, file, cb) {
        cb(null, req.params.username + '_tmp.' + mime.extension(file.mimetype));
    }
});

module.exports = upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        // extract files extension from files mimetype
        const ext = mime.extension(file.mimetype);
        const imageExtsSupported = JSON.parse(process.env.SUPPORTED_IMG_EXTS);
        if (imageExtsSupported.includes(ext)) {
            // for supported file extensions save file
            cb(null, true);
        } else {
            // for non supported file extensions don't even save the file
            cb({ code: 'FILE_FORMAT_NOT_SUPPORTED' }, false);
        }
    },
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE)
    }
}).single('profileImage');