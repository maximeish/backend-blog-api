import jwt from 'jsonwebtoken';
import dotEnv from 'dotenv';
import express from 'express';
import { displayPreviews, getPostById } from '../controllers/blog.controller';
import { getToken } from '../middlewares/getToken';


dotEnv.config();


const route = express.Router();


route.get('/blog', getToken, displayPreviews);

route.get('/blogPost', (req, res) => getPostById(req, res));


export default route;