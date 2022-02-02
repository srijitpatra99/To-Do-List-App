const express = require("express");
const {check , body}= require("express-validator");

const router = express.Router();

const userController = require("../controllers/user");
const authController = require("../middlewares/isAuth");
const User = require("../models/user");

router.get("/", userController.getLogin);

router.post("/login", 
            [
                check("email")
                .isEmail()
                .withMessage("Please enter a valid email")
                .normalizeEmail()
                .bail()
                .custom( value =>{
                    return User.findOne({email:value})
                                .then( userData =>{
                                    if(!userData)
                                    {
                                        return Promise.reject("New User? SignUp!!!");
                                    }
                                });
                })
            ]               
            ,userController.postLogin);

router.post("/logout", authController, userController.postLogout);

router.get("/signup", userController.getSignup);

router.post("/signup",
            [
                check("email")
                .isEmail()
                .withMessage("Please enter a valid email")
                .normalizeEmail()
                .toLowerCase()
                .bail()
                .custom( value => {
                   return  User.findOne({ email: value })
                                .then(userDoc =>{
                                    if(userDoc)//if user email already exists
                                    {
                                        return Promise.reject('Email already exists. Please login.');
                                    }
                                });
                    }),
                body('password')
                .isLength({min:5})
                .withMessage("Password too short, Min length must be 5")
                .trim(),
                body('confirmPassword') 
                .custom((value , {req}) =>{
                    if(value !== req.body.password)
                    {
                        throw new Error("Passwords doesn't match");
                    }
                    // Indicates the success of this synchronous custom validator
                    return true;
                })
                .trim(),
            ]
            ,userController.postSignup);

router.get("/forgot" , userController.getForgot);

router.post("/forgot", 
            [
                check("email")
                .isEmail()
                .withMessage("Please enter a valid email")
                .normalizeEmail()
                .toLowerCase()
                .bail()
                .custom( value =>{
                    return User.findOne({email:value})
                                .then( userData =>{
                                    if(!userData)
                                    {
                                        return Promise.reject("User with Email ID does not exist!!");
                                    }
                                });
                })
            ]
            ,userController.postForgot);

router.get("/activate/:token" , userController.verifyJwt);

router.get("/reset/:userId", userController.getReset);

router.post("/reset" ,
            [
                body('password')
                .isLength({min:5})
                .withMessage("Password too short, Min length must be 5")
                .trim(),
                body('confirmPassword') 
                .custom((value , {req}) =>{
                    if(value !== req.body.password)
                    {
                        throw new Error("Passwords doesn't match");
                    }
                    // Indicates the success of this synchronous custom validator
                    return true;
                })
                .trim(),
            ]
            ,userController.postReset);

module.exports = router;