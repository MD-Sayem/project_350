const  mongoose  = require('mongoose');
const schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const dataSchema = new mongoose.Schema ({
  serialNumber:Number,
  word: String,
  rootWord: String,
  inflection: String,
  status:{ type: Number, default: 0 } ,
  lock: { type: Number, default: 0 },
  usernam: String,
  time: Date
});
const Data = new mongoose.model("Data", dataSchema);

module.exports= Data
