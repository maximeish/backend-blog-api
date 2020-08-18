import express from 'express';
import * as bodyParser from 'body-parser';
import users from './routes/users';
import posts from './routes/posts';
import messages from './routes/messages';
import postComments from './routes/post-comments';
import createError from 'http-errors';
import auth from './routes/auth.route';

const app = express();
const port = 3000;

// support parsing of application/json type post data
app.use(bodyParser.json());

//support parsing of application/x-www-form-urlencoded post data
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.status(200).send("Welcome to my blog's backend API");
});

app.use('/', users);
app.use('/', posts);
app.use('/', messages);
app.use('/', postComments);
app.use('/', auth);

app.use(async (req, res, next) => {
    next(createError(404, "Resource Not Found"));
});

app.use(async (err, req, res, next) => {
    res.status(err.status).send({
        error: {
            status: err.status,
            message: err.message
        }
    });
});

app.listen(port, () => {
    console.log(`todo-api listening on http://localhost:${port}`);
});