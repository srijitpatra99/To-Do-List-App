require("dotenv").config();
const path= require("path");

const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');

const User = require("./models/user");
const taskRoutes = require("./routes/task");
const userRoutes = require("./routes/user");

const app=express();

const url= process.env.MONGO_URI;
const port = process.env.PORT || 8080;

const store = MongoStore.create({
    mongoUrl: url ,
    collectionName:'sessions',
    ttl: 10*24*60*60,//time till alive
    autoRemove: 'native'
    });
//setting up templating engine
app.set('view engine' , 'ejs');
app.set('views' , 'views');

//catch all favicon get request and return it to 204(no content status code)
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use(express.static(path.join(__dirname, "style")));
app.use(express.urlencoded({extended:false}));

app.use(
    session({
        secret:"SUPER_SECRET_KEY",
        resave:true, 
        saveUninitialized:true,
        store: store
    })
);
app.use(flash());

// app.use((req,res,next)=>{
//     req.session.firstName = "Srijit";
//     req.session.lastName = "Patra";
//     next();
// });

app.use((req,res,next)=>{
    if(!req.session.user)
    {
        return next();
    }
    User.findById(req.session.user._id)
        .then( userData =>{
            if(!userData)
            {
                return next();
            }
            req.user = userData;
            next();
        })
        .catch(err =>{
            console.log(err);
        })
})

app.use(userRoutes);
app.use(taskRoutes);

mongoose.connect(url)
        .then(result =>{
            console.log("successfully connected to "+url);
            console.log("connected on "+port);
            app.listen(port);
        })
        .catch(err =>{
            console.log(err);
        });