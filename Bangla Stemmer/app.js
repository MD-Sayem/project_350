
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
  workingWith: Number
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
  Status:{ type: Number, default: 0 } ,
  lock: { type: Number, default: 0 },
  username: String
  //,time:timestamp
});

const Data = new mongoose.model("Data", dataSchema);
app.post('/done',function(req,res){
  const filter={Number : req.user.workingWith}

  if(req.body.flag==0){
    const update ={lock:0}
    //dataTable.findOneAndUpdate(filter, update, {new: true});
  }
  else{
    root = req.body.rootWord;
    inflect=word.replace(root,'');
    inflect=word.replace('ে','এ');
    //const filter={Number : req.user.workingWith}
    // const update{
    //   rootWord :root,
    //   inflection : inflect,
    //   lock : 0,
    //   status: 1,
    // };
    //Data.findOneAndUpdate(filter, update, {new: true});
    //upadate the data on database
    // req.user.completed ++
  }

  res.redirect('/home')
});
app.get('/',function(req,res){
  res.render('index');
});
app.get('/home',function(req,res){
  // find one from the database where status==0 and lock==0
  // set lock=1;
  if(req.isAuthenticated()){
    res.render('data_entry_screen');}
  //   dataTable.findOne({lock:0, status:0}, function(err, foundWord){
  //       foundWord.lock=1;
  //       res.render("data_entry_screen" , {wd:foundWord});
  //     });
  // }
  // else{
  //   res.redirect('/')
  // }

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
        res.redirect("/home");
      });
    }
  });

});
app.get('/admin-login',function(req,res){
  res.render('admin_login')
});
app.post('/admin-login',function(req,res){
  res.render('admin')
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
app.get('/logout',function(req,res){
  //req.logout();
  res.redirect('/');
});
app.get('/my-profile',function(req,res){
  res.render('profile');
});
// reading the file
for(let i=0; i<500000; i++){
  // notunSobdo = read one string form the file
  // const data=new dataTable({
  //   serialNumber : i+1,
  //   word : notunSobdo
  // });
//  data.save();
}

app.listen(3000,function(err){
  console.log('Alhamdulillah Server Started on the port 3000');
  // let a="অর্থে"
  // let b=a.replace('অর্থ','')
  // console.log(b.replace('ে','এ'));
});
