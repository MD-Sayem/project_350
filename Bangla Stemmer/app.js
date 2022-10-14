
require('dotenv').config();
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
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine' , 'ejs');
app.use(express.static('public'));

mongoose.connect(process.env.MONGO_SERVER);
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
  whatType: {type: String, default:"user"}
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
// passport.serializeUser(function(user, done) {
//  done(null, user.id);
// });
//
// passport.deserializeUser(function(id, done) {
//  User.findById(id, function(err, user) {
//    done(err, user);
//  });
// });

const dataSchema = new mongoose.Schema ({
  serialNumber:Number,
  word: String,
  rootWord: String,
  inflection: String,
  status:{ type: Number, default: 0 } ,
  lock: { type: Number, default: 0 },
  usernam: String,
  time: Date
  //,time:timestamp
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
      Data.findOneAndUpdate(filter, update, {new: true});

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
          console.log('the word is '+word)
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
        console.log(req.user.completed+1);

    }
          Last.count({}, function( err, count){
          console.log( "Number of last:", count );
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
          res.render("data_entry_screen" , {wd:doc});
        }
        else{
          let dc=new Data({
            serialNumber:0,
            word:"ডেটা_শেষ_হয়ে_গেছে !"
          });
          dc.save();
          res.render("data_entry_screen" , {wd:dc});
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
  let lmt=hi-lo;
    //   Data.find({
    //
    // },
    // ['serialNumber','word','rootWord','inflection','usernam','time'], // Columns to Return
    //
    // {
    //     skip:lo, // Starting Row
    //     limit:lmt, // Ending Row
    //     sort:{
    //         serialNumber: 1 //Sort by Date Added
    //     }
    // },
    // function(err,found){
    // //    socket.emit('news-load', allNews); // Do something with the array of 10 objects
    // res.render('admin',{sobdo:found});
    // })
    Data.find({status:1,serialNumber: { $gte: lo, $lte: hi }},function(err,results){
      res.render('admin',{sobdo:results});
    }).sort({ serialNumber: -1 });
  console.log('low : '+lo+' high : '+hi);

});
app.get('/register',function(req,res){
  res.render('register');
});

app.post("/register", function(req, res){

  User.register({username : req.body.username, email:req.body.email}, req.body.password, function(err, user){
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
let book=["পূর্ণিমার","চাঁদের","দিকে","তাকালে","মনে","হয়","যেন","দুনিয়াটা","কতইনা","সুন্দর"];
for(let i=0; i<10; i++){
  // notunSobdo = read one string form the file
  let notunSobdo=book[i];
   const data=new Data({
    serialNumber : i+1,
    word : notunSobdo
  });
  // data.save();
}

app.listen(3000,function(err){
  console.log('Alhamdulillah Server Started on the port 3000');
  console.log(new Date());
  // let x=1;
  // if(true){
  //    x=2;
  // }
  // console.log(x);
});
