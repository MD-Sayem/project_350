const  mongoose  = require('mongoose');
const findOrCreate= require('mongoose-findorcreate');
const passport = require('passport');
const passportLocal= require('passport-local');
const passportLocalMongoose= require('passport-local-mongoose');

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  username: String,
  status:{type: String, default:"active"},
  completed: { type: Number, default: 0 },
  workingWith: {type:Number, default:0},
  role: {type: String, default:"user"},
  createdOn: Date
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

module.exports= User;
