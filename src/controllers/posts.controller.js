import jwt from 'jsonwebtoken';
import dotEnv from 'dotenv';
import mongoose from 'mongoose';
const Post = require('../models/posts');

dotEnv.config();

export const getPosts = (req, res) => {
    const { usertoken } = req.headers;

    if(usertoken) {
        jwt.verify(usertoken, process.env.SECRET_KEY, (err, authUser) => {
            if (err)
                return res.status(403).json({
                    status: "Forbidden",
                    message: "You need to provide a valid token"
                });

            if (authUser.role === process.env.NORMAL_USER_ROLE) {
                Post.find({}, (err, docs) => {
                    if (err) {
                        return res.status(500).json({
                            Error: err
                        })
                    }

                    if (docs.length > 0) {
                        let myDocs = [];
                        
                        docs.forEach(doc => {
                            if (doc.author === authUser.username) myDocs.push(doc);
                        })

                        if (myDocs.length > 0) {
                            return res.status(200).json({
                                status: "Success",
                                postsCount: myDocs.length,
                                posts: myDocs
                            })
                        } else {
                            return res.status(200).json({
                                status: "Success",
                                message: "You have not added any posts yet"
                            }) 
                        }
                    } else {
                        return res.status(200).json({
                            status: "Success",
                            message: "You have not added any posts yet"
                        })
                    }
                });
            }

            if (authUser.role === process.env.ADMIN_USER_ROLE) {
                Post.find({}, (err, docs) => {
                    if (err) {
                        return res.status(500).json({
                            Error: err
                        })
                    }

                    if (docs.length > 0) {
                        return res.status(200).json({
                            status: "Success",
                            postsCount: docs.length,
                            posts: docs
                        })
                    } else {
                        return res.status(200).json({
                            status: "Success",
                            message: "No posts available"
                        })
                    }
                });
            }
        })
    } else {
        return res.status(400).json({
            status: "Bad Request",
            message: "You need to provide a usertoken"
        })
    }
}

export const addPost = (req, res) => {
    const { usertoken } = req.headers;
    const { title, body } = req.body;
    if (usertoken && title && body) {
        jwt.verify(usertoken, process.env.SECRET_KEY, (err, authUser) => {
            if (err) {
                return res.status(403).json({
                    status: "Forbidden",
                    message: "You need to provide a valid token"
                });
            }

            if (authUser.role === process.env.ADMIN_USER_ROLE || authUser.role === process.env.NORMAL_USER_ROLE) {
                const post = new Post({
                    _id: new mongoose.Types.ObjectId(),
                    title,
                    body,
                    author: authUser.username.toString(),
                    date_posted: new Date()
                });

                post.save()
                    .then(result => {
                        return res.status(200).json({
                            status: "Post successfully created",
                            message: result
                        })
                    })
                    .catch(err => {
                        return res.status(500).json({
                            Error: err
                        })
                    })
            } else {
                return res.status(403).json({
                    status: "Unauthorized",
                    message: "You are not allowed to use this feature"
                });
            }
        });
    }

    else res.status(400).json({
        status: 'Bad Request',
        message: 'Please, provide all details (usertoken, title, body)'
    });
}

export const deletePost = (req, res) => {
    const { usertoken } = req.headers;
    const { postid } = req.body;
    
    if (usertoken && postid) {
        jwt.verify(usertoken, process.env.SECRET_KEY, (err, authUser) => {
            if (err) {
                return res.status(403).json({
                    status: "Unauthorized",
                    message: "You need to supply a valid token"
                });
            }

            if (authUser.role === process.env.NORMAL_USER_ROLE) {
                Post.findById(postid)
                    .exec()
                    .then(doc => {
                        if (doc) {
                            if (doc.author === authUser.username) {
                                Post.deleteOne({ _id: postid })
                                    .exec()
                                    .then(result => {
                                        if (result.deletedCount > 0) {
                                            return res.status(200).json({
                                                status: "Post successfully deleted",
                                                message: result
                                            });
                                        } else {
                                            return res.status(404).json({
                                                status: "Not Found",
                                                message: "Cannot find a post with the provided id"
                                            })
                                        }
                                    })
                                    .catch(err => {
                                        return res.status(500).json({
                                            Error: err
                                        })
                                    })
                            } else {
                                return res.status(403).json({
                                    status: "Unauthorized",
                                    message: "You are not allowed to delete this post"
                                })
                            }
                        } else {
                            return res.status(404).json({
                                status: "Not Found",
                                message: "Cannot find a post with the id provided"
                            })
                        }
                    })
                    .catch(err => {
                        return res.status(500).json({
                            Error: err
                        })
                    })
            }

            if (authUser.role === process.env.ADMIN_USER_ROLE) {
                Post.deleteOne({ _id: postid })
                    .exec()
                    .then(result => {
                        if (result.deletedCount > 0) {
                            return res.status(200).json({
                                status: "Post successfully deleted",
                                message: result
                            });
                        } else {
                            return res.status(404).json({
                                status: "Not Found",
                                message: "Cannot find a post with the provided id"
                            })
                        }
                    })
                    .catch(err => {
                        return res.status(500).json({
                            Error: err
                        })
                    })
            }
        });
    }
    
    else 
        return res.status(400).json({
            status: 400,
            message: 'Supply the usertoken and post id'
        });
}

export const updatePost = (req, res) => {
    const { usertoken } = req.headers;
    let { postid, title, body, author } = req.body;
    if (usertoken && postid && (title || body || author)) {
        jwt.verify(usertoken, process.env.SECRET_KEY, (err, authUser) => {
            if (err) {
                return res.status(403).json({
                    status: "Unauthorized",
                    message: "You are not allowed to perform this operation due to invalid token"
                });
            };

            if (authUser.role === process.env.NORMAL_USER_ROLE) {
                Post.find({_id: postid}, (err, post) => {
                    if (err) {
                        return res.status(500).json({
                            status: "Post.find error",
                            Error: err
                        })
                    }

                    if (post.length > 0) {
                        if (post[0].author === authUser.username) {
                            title = title || post[0].title;
                            body = body || post[0].body;
                            author = post[0].author;
                            
                            Post.updateOne({ _id: postid }, { $set: { title, body, author } })
                                .exec()
                                .then(result => {
                                    return res.status(200).json({
                                        status: "Post updated successfully",
                                        message: result
                                    })
                                })
                                .catch(err => {
                                    return res.status(500).json({
                                        status: "Post.update",
                                        Error: err
                                    })
                                })
                        } else {
                            return res.status(403).json({
                                status: "Unauthorized",
                                message: "You are not allowed to edit this post"
                            })
                        }
                    } else {
                        return res.status(404).json({
                            status: "Not Found",
                            message: "Post with the provided id not found"
                        })
                    }
                })
            }

            if (authUser.role === process.env.ADMIN_USER_ROLE) {
                Post.find({_id: postid}, (err, post) => {
                    if (err) {
                        return res.status(500).json({
                            status: "Post.find error",
                            Error: err
                        })
                    }

                    if (post.length > 0) {
                        title = title || post[0].title;
                        body = body || post[0].body;
                        author = author || post[0].author;
                        
                        Post.updateOne({ _id: postid }, { $set: { title, body, author } })
                            .exec()
                            .then(result => {
                                return res.status(200).json({
                                    status: "Post updated successfully",
                                    message: result
                                })
                            })
                            .catch(err => {
                                return res.status(500).json({
                                    status: "Post.update",
                                    Error: err
                                })
                            })
                    } else {
                        return res.status(404).json({
                            status: "Not Found",
                            message: "Cannot find a post with the provided id"
                        })
                    }
                });
            }
        });
    } else res.status(400).json({
        status: 'Bad Request',
        message: 'You must provide the usertoken and postid and update at least one field: title, body, or author'
    });
}