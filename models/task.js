const mongoose = require("mongoose");

const schema = mongoose.Schema;

const taskSchema  = new schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    createdAt: String,
    userId:{
        type: schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

module.exports = mongoose.model('Task' , taskSchema);