const express=require("express");

const router = express.Router();
const taskController = require("../controllers/task");
const authController = require("../middlewares/isAuth");

router.get("/task", authController, taskController.getTask);

router.post("/addTask" , authController, taskController.addTask);

router.post("/delete" , authController, taskController.deleteTask);

router.post("/deleteAll", authController, taskController.deleteAllTask);

module.exports = router;