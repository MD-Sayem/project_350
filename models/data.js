const  mongoose  = require('mongoose');
const schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const dataSchema = new mongoose.Schema ({
  serialNumber:Number,
  word: String,
  rootWord: String,
  rootWord1:String,
  inflection: String,
  inflection1: String,
  status:{ type: Number, default: 0 } ,
  lock: { type: Number, default: 0 },
  usernam: String,
  usernam1: String,
  time: Date,
  time1: Date
  
});
const Data = new mongoose.model("Data", dataSchema);

module.exports= Data
