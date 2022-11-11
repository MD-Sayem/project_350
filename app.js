
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
const loginRouter = require('./routes/login');
const colors = require('colors');
const {Parser}=require('json2csv');

const app =express();
// app.use("/api/product",product);
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine' , 'ejs');
app.use(express.static('public'));
let SECRET="Our_little_secret"
let MONGO_SERVER_1="mongodb+srv://admin_sayem:s1a2y3e4m5@cluster0.1drsu.mongodb.net/BanglaStemmingDB"
let MONGO_SERVER_2="mongodb+srv://admin_sayem:s1a2y3e4m5@cluster0.1drsu.mongodb.net/testDB"
// mongoose.connect(MONGO_SERVER_2);
mongoose.connect(MONGO_SERVER_2)
.then(()=>{
    console.log("Connected to databases!!".rainbow)
})
.catch(err=>{
    console.log("Sorry, cannot connect!".red)
    console.log(err)
})

// mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});
//mongoose.set("useCreateIndex", true);

app.use(session({
  secret: SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

async function makeFree(usr) {
  try{
    await User.findOneAndUpdate({username:usr},
                           {$set:{workingWith:0}},  //  {$set:{completed:nowCompleted,workingWith:0}},
                           {new: true}, (err, doc) => {});
      return doc.save();
  }
  catch(error){

  }
}

const userSchema = new mongoose.Schema ({
  email: String,
  password: String,
  username: String,
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

async function updateData(filter,update){
  try{
    await  Data.findOneAndUpdate(filter,{$set:update},{new: true}, (err, doc) => {});

     doc.save();
    // setTimeout(() => {console.log("Delayed for 1 second.");}, "1000");
     return 1;
  }
  catch(err){
    console.log(err);
  }
}
const Data = new mongoose.model("Data", dataSchema);
app.post('/done',function(req,res){
  if(req.isAuthenticated()){
    let nowCompleted=req.user.completed+1;
    let usr=req.user.username;

    makeFree(usr);
     // User.findOneAndUpdate({username:usr},
     //                        {$set:{workingWith:0}},  //  {$set:{completed:nowCompleted,workingWith:0}},
     //                        {new: true}, (err, doc) => {});


    const filter={serialNumber : req.body.num}

      let word=req.body.sobdo;
      let root = req.body.rt;
      let inflect=word.replace(root,'');
      let d=new Date();
      let update ={
        lock:0,
        status:2
      }; //skip

      if(req.body.whatToDo=='complete'){
        if(word.includes(root)==true && root[0]==word[0]){ //valid
          update={
            rootWord :root,
            inflection : inflect,
            lock : 0,
            status: 1,
            usernam: req.user.username,
            time: d
          };
        }
        else{  // invalid root
          update={lock:0};
        }

      }
      else if(req.body.whatToDo=='gerbage'){     //no inflection

          update={
          lock : 0,
          status: 3,
        };
      }

       Data.findOneAndUpdate(filter, {$set:update}, {new: true}, (err, doc) => {
        if (err) {
            console.log(req.user.username +" fecing problem when updating data! ");
        }
      });
    res.redirect('/home');
  }
  else{
    res.redirect('/')
  }
});
app.use('/',loginRouter);
// app.get('/',function(req,res){
//   res.render('index');
// });
app.get('/home',function(req,res){
  // find one from the database where status==0 and lock==0
  // set lock=1;
  if(req.isAuthenticated()){
    let number=req.user.workingWith;
    console.log(req.user.username+' working with word no: '+number);
    // console.log('previousWorkedWith : '+number);
    if(number!=0){
      Data.findOne({serialNumber:number},function(err,result){
        if(err){
          console.log(err);
        }
          res.render("data_entry_screen" , {wd:result,me:req.user});
      });
    }
  else{ //workingWith==0
    let sobdo=new Data();
    let filter={lock:0, status:0};
      let update={lock:1}



      Data.findOneAndUpdate(filter, {$set:update}, {new: true}, (err, doc) => {
        if (err) {
            console.log(req.user.username +" had Something wrong when finding word!!");
        }
        if(doc!=null){
          req.user.workingWith=doc.serialNumber;

          res.render("data_entry_screen" , {wd:doc,me:req.user});
        //  console.log('the number is '+number);
          let no=doc.serialNumber;
          User.findOneAndUpdate({username:req.user.username}, //give up the lock
                             {$set:{workingWith:no}},
                              {new: true}, (err, doc) => {
            // console.log('nowWorkingWith the word: '+doc);
                              });
        //  console.log(req.user);
        }
        else{
          const fltr={status : 2};   //from skipped
          const updt ={ status : 0};  // making incomplete
          Data.updateMany(fltr, {$set:updt}, {new: true}, (err, doc) => {});
          res.send('<h1>ডেটা_শেষ_হয়ে_গেছে !</h1>');


        }
        });
  }

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
        if(user.username=='admin_101'||user.role=='admin'){
          res.redirect('/admin');
          console.log('admin logged in');
        }
        else{
              res.redirect("/home");
              console.log(req.user.username+' login done; working '+req.user.workingWith);
        }
      });
    }
  });

});
app.get('/admin-login',function(req,res){
  res.render('admin_login');
});
app.get('/admin',function(req,res){

  if(req.isAuthenticated()&&(req.user.username=='admin_101'||req.user.role=='admin')){
    // Last.find({},function(err,found){
    //   if(err){
    //     console.log(err);
    //   }
    //   res.render('admin',{sobdo:found});
    // });
  //  models.Post
    let usr=req.user.username;
      Data
      .find({status: 1})
      .sort({'time': -1})
      .limit(10)
      .exec(function(err, posts) {
        res.render('admin',{sobdo:posts,who:usr,page:"lastTen"});
           // `posts` will be of length 20
      });
  }
  else{
    res.redirect('/admin-login');
  }

});



app.get('/my-words',function(req,res){
  if(req.isAuthenticated()){
    let usr=req.user.username;
  //  console.log(usr);
      Data
      .find({status: 1,usernam:usr})
      .sort({'time': -1})
      .limit(10)
      .exec(function(err, posts) {
        res.render('admin',{sobdo:posts,who:usr,page:"lastTen"});
           // `posts` will be of length 20
      });
  }
  else{
    res.redirect('/admin-login');
  }

});


app.post('/query',function(req,res){
  let lo=req.body.lowerLimit;
  let hi=req.body.upperLimit;
  let usr=req.user.username;
  let filter={status:1,serialNumber: { $gte: lo, $lte: hi }};
  if(usr!='admin_101' && req.user.role!='admin'){
     filter={status:1,usernam:usr,serialNumber: { $gte: lo, $lte: hi }};
  }
    Data.find(filter,function(err,results){
      res.render('admin',{sobdo:results, who:usr,page:"query"});
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
app.post('/addminLogout',function(req,res){
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/admin-login');
  });
});

app.post('/logout', function(req, res, next) {

  //  console.log(req.user);
    const filter={serialNumber:req.user.workingWith};
    const update={lock:0};
    Data.findOneAndUpdate(filter, {$set:update}, {new: true}, (err, doc) => {});
    let usr=req.user.username;
    User.findOneAndUpdate({username:usr},{workingWith:0},{new:true},(err,doc)=>{});
    console.log(req.user.username+" logged out and unlocked "+filter.serialNumber);
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
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

// const file = readline.createInterface({
//     input: fs.createReadStream('./data/a1.txt'),
//     output: process.stdout,
//     terminal: false
// });
//
// let i=501;
//     file.on('line', (line) => {
//       const data=new Data({
//       serialNumber : i++,
//       word : line
//      });
//       data.save()
//   });


  const fltr={lock : 1}
  const updt ={ lock : 0};
Data.updateMany(fltr, {$set:updt}, {new: true}, (err, doc) => {});

const statusSchema = new mongoose.Schema ({
  incomplete: Number,
  complete: Number,
  skip: Number,
  gerbage: Number
});
app.post('/edit',function(req,res){
  if(req.isAuthenticated()){
      let sl=req.body.serialNo;
      let word=req.body.givenWord;
      let rt=req.body.rootWord;
      let inf= word.replace(rt,'');
      let filter={serialNumber:sl};
      let update={
                    rootWord:rt,
                    inflection:inf
                  };
      if (word.includes(rt)==true && rt[0]==word[0]) {

        updateData(filter,update);
        // Data.findOneAndUpdate(filter,{$set:update},{new: true}, (err, doc) => {});
        // const result = await Data.findOne({_id: req.user.id}).exec();
      }
      // console.log(req.body);
      // console.log(sl);
      // console.log(update);
      let usr=req.user.username;
      if(req.body.pagename=='query'){
        let lo=req.body.start;
        let hi=req.body.end;
        let fl={status:1,serialNumber: { $gte: lo, $lte: hi }}
        if(req.user.username!='admin_101'&&req.user.role!='admin'){
          fl={status:1,usernam:usr,serialNumber: { $gte: lo, $lte: hi }}
        }
        let pg='query';
          Data.find(fl,function(err,results){
            res.render('admin',{sobdo:results,who:usr, page:pg});
          }).sort({ serialNumber: -1 });
      }
      else{ // lastTen
        if(req.user.role=='admin'||req.user.username=="admin_101"){
          res.redirect('/admin');
        }
        else{
          res.redirect('/my-words');
        }
      }

  }
  else{
    res.redirect('\admin-login');
  }

});



// const Status = new mongoose.model("Status", statusSchema);
// const stat=new Status({
//   incomplete:0,
//   complete: 1,
//   skip: 2,
//   gerbage: 3
// });
// stat.save();


app.get('/get-csv',function(req,res){
			    let usr="sam74";
			  Data
			  .find({},'_id serialNumber status lock  word rootWord inflection usernam time')
			  .sort({'time': -1})
			  .limit(10)
			  .exec(function(err, results) {

         jsonData=JSON.stringify(results);
        //
        // console.log(typeof jsonData);
        const fields = ['_id', 'serialNumber', 'status', 'lock',  'word', 'rootWord', 'inflection', 'usernam', 'time'];
				const jsons2csvParser=new Parser({fields});
				const info = jsons2csvParser.parse(results);
      //  res.send(jsonData);
        res.attachment('stemmedWords.csv');
        res.status(200).send(jsons2csvParser.parse(results));

        fs.writeFile('./backups/last10.csv',info,function(err){
        		if(err){
        			console.log(err);
        		}
        	});
			  });
        //csv file writtern



		});


app.listen(process.env.PORT||3000,function(err){
  // Data.find({},function(err,results){
  //   for(let i=0; i<500; i++){
  //       console.log(results[i].serialNumber);
  //   }

  // });
  console.log('Alhamdulillah Server Started at '+new Date());
});
