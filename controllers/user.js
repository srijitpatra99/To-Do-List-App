require('dotenv').config();
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const { validationResult } = require("express-validator");

const User = require("../models/user");

exports.getLogin = (req,res,next)=>{
    let msg1= req.flash('success_msg');
    let msg2= req.flash('error_msg');
    let message = (msg1.length > 0) ? msg1 : msg2;
    let success=  (msg1.length > 0 ) ? true: false;
    if(message.length>0)
    {
        message=message[0];
    }
    else
    {
        message=null;
    }
    res.render("auth",{
        errorMessage:message,
        success:success
    });
};

exports.postLogin = (req,res,next)=>{
    const email = req.body.email;
    const password = req.body.password;
    const errors = validationResult(req);

    if(!errors.isEmpty())
    {
        console.log(errors);
        return res.status(422).render("auth",{
            errorMessage:errors.array()[0].msg,
            success:false
        });
    }
    User.findOne({email:email})
        .then(userData =>{
            if(userData)
            {
                if(userData.password !== password)
                { 
                    return res.status(422).render("auth",{
                        errorMessage:"Incorrect Password",
                        success:false
                    });
                }
                req.session.isLoggedIn = true;
                req.session.user = userData;
                return req.session.save( (result) => {
                    res.redirect("/task");
                });
            }
            else
            {
                return res.status(422).render("auth",{
                    errorMessage:"New User?? SignUp.",
                    success:false
                });                
            }
        })
        .catch(err => console.log(err));
};

exports.postLogout = (req,res,next) => {
    req.session.destroy( result =>{
        console.log(result);
        res.redirect("/");
    })
};
exports.getSignup = (req,res,next)=>{
    console.log("inside signup")
    res.render("auth",{
        errorMessage:"",
        success:false
    });
};

exports.postSignup = (req,res,next)=>{
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    const errors = validationResult(req);

    if(!errors.isEmpty())
    {
        console.log(errors);
        return res.status(422).render("auth",{
            errorMessage:errors.array()[0].msg,
            success:false
        });        
    }

    const user = new User({
        email:email,
        password:password
    })

    user.save()
        .then( result =>{
            req.flash('success_msg', 'Signup successful. Please login.')
            console.log("user created.");
            res.redirect("/");
        })
        .catch(err => {console.log(err)});
};

exports.getForgot = (req,res,next) =>{
    let message = req.flash('error_msg');//returns an array
    if(message.length>0)
    {
        message = message[0];
    }
    else
    {
        message=null;
    }
    res.status(200).render("reset",{
        errorMessage:message
    });
};

exports.postForgot = (req,res,next) =>{
    const email = req.body.email;
    const errors = validationResult(req);

    if(!errors.isEmpty())
    {
        console.log(errors);
        return res.status(422).render("auth",{
            errorMessage:errors.array()[0].msg,
            success:false
        });
    }
    
    const jwtKey = process.env.JWT_KEY;
    const user = process.env.user;
    const clientId = process.env.clientId;
    const clientSecret = process.env.clientSecret;
    const redirectUri = process.env.redirectUri;
    const refreshToken = process.env.refreshToken;
    const accessToken = process.env.accessToken;

    const oauth2Client = new OAuth2(
        clientId,clientSecret,redirectUri,
    );

    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });

    User.findOne({email : email})
        .then( userData =>{
            if(!userData)
            {
                return res.status(422).render("auth",{
                    errorMessage:"User with Email ID does not exist!!"
                });
            }
            const token = jwt.sign({ _id: userData._id}, jwtKey, { expiresIn: '30m' });
            const CLIENT_URL = 'http://' + req.headers.host;

            const output = `
            <h2>Please click on below link to activate your account</h2>
            <p>${CLIENT_URL}/activate/${token}</p>
            <p><b>NOTE: </b> The above activation link expires in 30 minutes.</p>
            `;
            
            const transporter = nodemailer.createTransport({
                service:"gmail",
                auth: {
                    type:"OAUTH2",
                    user:user,
                    clientId:clientId,
                    clientSecret:clientSecret,
                    refreshToken: refreshToken,
                    accessToken:accessToken,
                },
                tls:{
                    rejectUnauthorized:false
                }
            });

            const mailOptions = {
                from: `"Its Srijit" <${user}>`, // sender address
                to: email, // list of receivers
                subject: "Account Password Reset: taskManager Authorization ✔", // Subject line
                html: output, // html body
            };

            transporter.sendMail(mailOptions, (err, info)=>{
                if(err)
                {
                    console.log(err);
                    req.flash(
                        'error_msg',
                        'Something went wrong on our end. Please try again later.'
                    );
                    res.status(503).redirect('/forgot');
                }
                else {
                    console.log('Mail sent : %s', info);
                    req.flash(
                        'success_msg',
                        'Password reset link sent to email ID. Please follow the instructions.'
                    );
                    res.status(200).redirect('/');
                }
            });
        })
        .catch( err => console.log(err));
};

exports.verifyJwt = (req,res,next)=>{
    const token = req.params.token;
    const jwtKey = process.env.JWT_KEY;

    if(!token)
    {
        console.log("Password Reset Error");
    }
    else
    {
        jwt.verify(token, jwtKey, (err, decodedToken) =>{
            if (err) {
                return res.status(423).render("auth",{
                    errorMessage:"Incorrect or Expired Link.",
                    success:false
                });
            }
            else
            {
                const _id = decodedToken._id;
                User.findById({_id})
                    .then( userData => {
                        if(!userData)
                        {
                            req.flash('error_msg', 'User with email ID does not exist! Please try again.');
                            res.redirect("/");
                        }
                        else
                        {
                            res.redirect(`/reset/${_id}`);
                        }
                    });
            }
        });
    }
};

exports.getReset = (req,res,next)=>{
    let message = req.flash("error_msg");
    if(message.length>0)
    {
        message= message[0];
    }
    else
    {
        message = null;
    }
    const userId = req.params.userId;
    User.findById({_id : userId})
        .then( userData =>{
            if(!userData)
            {
                req.flash('error_msg','User with email ID does not exist! Please try again.');
                res.redirect("/");
            }
            else
            {
                return res.status(200).render("setPassword", {
                    errorMessage:message,
                    userInfo: userData.email,
                    userId:userData._id
                });
            }
        })
        .catch(err => console.log(err));
};

exports.postReset = async (req,res,next) =>{
    const _id = req.body.userId;
    const email = req.body.email;
    const password = req.body.password;
    const confirmPassword = req.body.confirmPassword;
    
    await User.findOneAndUpdate(
                {email: email}, 
                {password: password},
                function (err, result) {
                    if (err) {
                        req.flash(
                            'error_msg',
                            'Error resetting password!'
                        );
                        res.redirect(`/reset/${_id}`);
                    } else {
                        req.flash(
                            'success_msg',
                            'Password reset successfully!'
                        );
                        res.redirect('/');
                    }
                });
};