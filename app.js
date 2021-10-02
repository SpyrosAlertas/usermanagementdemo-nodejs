const express = require('express');
const cors = require('cors');

// require configuration properties
require('dotenv').config();

const app = express();

// create profile-images directory if it doesn't exist
const fs = require('fs');
const path = require('path');
if (!fs.existsSync(path.join(path.dirname(require.main.filename), process.env.IMAGES_FOLDER_NAME))) {
    fs.mkdirSync(path.join(path.dirname(require.main.filename), process.env.IMAGES_FOLDER_NAME));
}

// CORS options
const corsOptions = {
    // we parse because we store an array of strings with the origins we want to allow
    origin: JSON.parse(process.env.ORIGINS),
    exposedHeaders: [process.env.TOKEN_HEADER],
    optionsSuccessStatus: 200
}

// enable cors options globally in our app
app.use(cors(corsOptions));

// use json middleware to convert request body to JSON
app.use(express.json());

// user routes
const userRoute = require('./routes/users');
app.use('/users', userRoute);

// catch all remaining/unknown routes and return a 404 error
const pageNotFound = require('./routes/pageNotFound');
app.use(pageNotFound);

// handle errors - has to be called after routes that will use this error handler
const errorHandler = require('./error/errorHandler');
app.use(errorHandler)

// use environments default port - or if there isn't one use the one configured in .env
const port = process.env.PORT || process.env.APP_PORT;

// start server
app.listen(port, () => {
    console.log(`Server running on port: ${port}`);
});