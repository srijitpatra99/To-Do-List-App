const Task = require("../models/task");

exports.getTask = (req,res,next) =>{
    Task.find({userId: req.user._id})
        .then(tasks =>{
            res.render("index",{
                task:tasks
            });
        })
        .catch(err =>{
            console.log(err);   
        });
};

exports.addTask= (req,res,next)=>{
    const taskName = req.body.task;
    const timestamp = new Date();
    var newDate = timestamp.toString().split('G')[0];
    const task = new Task({
        name: taskName,
        createdAt: newDate,
        userId: req.user._id
    })
    task.save()
        .then(result =>{
            // console.log("Task Added sucessfully");
            res.redirect("/task");
        })
        .catch(err => console.log(err));
};

exports.deleteTask = (req,res,next)=>{
    const taskId = req.body.taskId;

    Task.deleteOne({_id:taskId})
        .then( result =>{
            // console.log("task deleted sucessfully");
            res.redirect("/task");
        })
        .catch(err => console.log(err));
};

exports.deleteAllTask = (req,res,next)=>{
    Task.deleteMany({userId:req.user._id})
        .then(result =>{
            console.log(result);
            // console.log("All tasks deleted sucessfully");
            res.redirect("/task");
        })
        .catch(err => console.log(err));
};