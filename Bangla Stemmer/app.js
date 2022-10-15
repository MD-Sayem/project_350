
require('dotenv').config();
// const product =require('./api/product');
const fs = require('fs');
const readline = require('readline');
const {readFileSync, promises: fsPromises} = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const passportLocal= require('passport-local');
const passportLocalMongoose= require('passport-local-mongoose');
const ejs= require('ejs');
const session= require('express-session');
const mongoose= require('mongoose');
const findOrCreate= require('mongoose-findorcreate');


const app =express();
// app.use("/api/product",product);
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine' , 'ejs');
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_SERVER_2);
// mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});
//mongoose.set("useCreateIndex", true);

app.use(session({
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());


const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  username: String,
  completed: { type: Number, default: 0 },
  workingWith: Number,
  whatType: {type: String, default:"user"},
  createdOn: Date
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
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

let lastTenSchema =new mongoose.Schema({
  serialNumber:Number,
  word: String,
  rootWord: String,
  inflection: String,
  usernam: String,
  time: Date
});
const Last = new mongoose.model("Last", lastTenSchema);
app.post('/done',function(req,res){
  if(req.isAuthenticated()){
    const filter={serialNumber : req.body.num}

    if(req.body.whatToDo=="skip"){
      const update ={lock:0}
      Data.findOneAndUpdate(filter, {$set:update}, {new: true}, (err, doc) => {});

    }
    else {
      let word=req.body.sobdo;
      let root = req.body.rt;
      let inflect=word.replace(root,'');
      let sesDos;
      let d=new Date();
      let update={};
      if(req.body.whatToDo=='complete'){
          update={
          rootWord :root,
          inflection : inflect,
          lock : 0,
          status: 1,
          usernam: req.user.username,
          time: d
        };
      }
      else{     //no inflection
      //    console.log('the word is '+word)
          update={
          rootWord :word,
          inflection : "",
          lock : 0,
          status: 1,
          usernam: req.user.username,
          time: d
        };

      }

      Data.findOneAndUpdate(filter, {$set:update}, {new: true}, (err, doc) => {
        if (err) {
            console.log("Something wrong when updating data!");
        }
          sesDos=new Last({
            serialNumber:doc.serialNumber,
            word: doc.word,
            rootWord:root,
            inflection: doc.inflection,
            usernam: req.user.username,
            time: d
          })
          sesDos.save();
        });
        let nowCompleted=req.user.completed+1;
        User.findOneAndUpdate({username:req.user.username}, {$set:{completed:nowCompleted}}, {new: true}, (err, doc) => {});
        //req.user.completed ++
    //    console.log(req.user.completed+1);

    }
          Last.count({}, function( err, count){
        //  console.log( "Number of last:", count );
          if(count>3){
            //delete the first
            Last.findOneAndDelete({status:1}, function (err, docs) {});

          }

        });
        // console.log('total data in last is'+number);

    res.redirect('/home')
  }
  else{
    res.redirect('/')
  }
});
app.get('/',function(req,res){
  res.render('index');
});
app.get('/home',function(req,res){
  // find one from the database where status==0 and lock==0
  // set lock=1;
  if(req.isAuthenticated()){

    let sobdo=new Data();
    let filter={lock:0, status:0};
      let update={lock:1}



      Data.findOneAndUpdate(filter, {$set:update}, {new: true}, (err, doc) => {
        if (err) {
            console.log("Something wrong when updating data!");
        }
        if(doc!=null){
          req.user.workingWith=doc.serialNumber;
          res.render("data_entry_screen" , {wd:doc,me:req.user});
        //  console.log(req.user);
        }
        else{
          let dc=new Data({
            serialNumber:0,
            word:"ডেটা_শেষ_হয়ে_গেছে !"
          });
          dc.save();
          res.render("data_entry_screen" , {wd:dc,me:req.user});
        }

        });

  }
  else{
    res.redirect('/')
  }

});


app.post("/login", function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
      res.redirect('/');
    } else {
      passport.authenticate("local")(req, res, function(){
        if(user.username=='admin_101'||user.whatType=='admin'){
          res.redirect('/admin');
        }
        else{
              res.redirect("/home");
        }
      });
    }
  });

});
app.get('/admin-login',function(req,res){
  res.render('admin_login');
});
app.get('/admin',function(req,res){
  if(req.isAuthenticated()&&(req.user.username=='admin_101'||req.user.whatType=='admin')){
    Last.find({},function(err,found){
      if(err){
        console.log(err);
      }
      res.render('admin',{sobdo:found});
    });
  }
  else{
    res.redirect('/admin-login');
  }

});
app.post('/admin',function(req,res){
  let lo=req.body.lowerLimit;
  let hi=req.body.upperLimit;

    Data.find({status:1,serialNumber: { $gte: lo, $lte: hi }},function(err,results){
      res.render('admin',{sobdo:results});
    }).sort({ serialNumber: -1 });
//  console.log('low : '+lo+' high : '+hi);

});
app.get('/register',function(req,res){
  res.render('register');
});

app.post("/register", function(req, res){
  let memberSince=new Date();
  User.register({username : req.body.username, email:req.body.email, createdOn:memberSince}, req.body.password, function(err, user){
    if (err) {
      console.log(err);
      res.redirect("/");
    } else {
      passport.authenticate("local")(req, res, function(){
        res.redirect("/home");
      });
    }
  });

});

app.post('/logout', function(req, res, next) {

  //  console.log(req.user);
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/');
  });


});
app.get('/my-profile',function(req,res){
  if(req.isAuthenticated()){
    res.render('profile',{myself:req.user});
  }
  else {
    res.render('/');
  }
});
// reading the file

const file = readline.createInterface({
    input: fs.createReadStream('../datas/test.txt'),
    output: process.stdout,
    terminal: false
});

let i=0;
    file.on('line', (line) => {
      const data=new Data({
      serialNumber : ++i,
      word : line
     });
  //    save the data
  });


  const filter={lock : 1}
  const update ={ lock : 0}
//  Data.findOneAndUpdate(filter, update, {new: true});
//  Data.updateMany(filter, { $set: update });
Data.updateMany(filter, {$set:update}, {new: true}, (err, doc) => {});

app.listen(process.env.PORT||3000,function(err){
  console.log('Alhamdulillah Server Started at '+new Date());

});
