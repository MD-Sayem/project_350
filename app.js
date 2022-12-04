
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
const homeRouter =require('./routes/home');
// const convertFile=require('./utilities/dataEntry');
const colors = require('colors');
const {Parser}=require('json2csv');
const {spawn}=require('child_process');
const path = require('path');
const app =express();
// app.use("/api/product",product);
app.use(bodyParser.urlencoded({extended: true}));

app.set('view engine' , 'ejs');
app.use(express.static('public'));

let MONGO_SERVER_1="BanglaStemmingDB";
let MONGO_SERVER_2="testDB";
// mongoose.connect(MONGO_SERVER_2);
mongoose.connect(process.env.MONGO_SERVER_1)
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
  secret: process.env.SECRET,
  resave: false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

app.use('/home',homeRouter);
app.use('/',loginRouter);




function countWords(username){
    Data.count({usernam:username}, function( err, cnt){
      console.log(username+" has completed total "+cnt)
    return cnt;
});
}
async function makeFree(usr) {
  try{
    let nowCompleted=0;
    // nowCompleted=countWords(usr);
    await User.findOneAndUpdate({username:usr},
                           {$set:{workingWith:0,completed:nowCompleted}},  //  {$set:{completed:nowCompleted,workingWith:0}},
                           {new: true}, (err, doc) => {});
      return doc.save();
  }
  catch(error){

  }
}
async function updateData(filter,update){
  try{
    await Data.findOneAndUpdate(filter, {$set:update}, {new: true}, (err, doc) => {
     if (err) {
       //  console.log(req.user.username +" fecing problem when updating data! ");
         console.log(" facing problem while updating the word "+doc.word);
     }
     return doc.save();
   });
  }
  catch(err){

  }
}

const User=require('./models/user');

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const Data= require('./models/data');
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

app.post('/done',function(req,res){
  if(req.isAuthenticated()&&req.user.status=="active"){
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
        status:2,
        time:d
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
          time:d
        };
      }

      updateData(filter,update);
    res.redirect('/home');
  }
  else{
    res.redirect('/')
  }
});

app.get('/admin-login',function(req,res){
  res.render('admin_login');
});
app.get('/admin',function(req,res){

  if(req.isAuthenticated() && req.user.role=='admin'){

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
  if(req.isAuthenticated()&&req.user.status=="active"){
    let usr=req.user.username;
  //  console.log(usr);
      Data
      .find({status: 1,usernam:usr})
      .sort({'time': -1})
      .limit(10)
      .exec(function(err, posts) {
        res.render('myWords',{sobdo:posts,who:usr,page:"lastTen"});
           // `posts` will be of length 20
      });
  }
  else{
    res.redirect('/');
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
  if(req.isAuthenticated() && req.user.role=='admin'){
    res.render('signup');
  }
  else{
    res.redirect('/admin-login');
  }

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
app.post('/admin-logout',function(req,res){
  req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/admin-login');
  });
});



app.get('/my-profile',function(req,res){
  if(req.isAuthenticated()&&req.user.status=="active"){

    Data.count({usernam:req.user.username}, function( err, count){
      res.render('profile',{myself:req.user  , cnt:count});
  });
  }
  else{
    res.redirect('/');
  }
});

// reading the file




  const fltr={lock : 1}
  const updt ={ lock : 0};
Data.updateMany(fltr, {$set:updt}, {new: true}, (err, doc) => {});

app.post('/edit',function(req,res){
  if(req.isAuthenticated()&&req.user.status=="active"){
      let tarikh=Date.now();
      let manush=req.user.username;
      let sl=req.body.serialNo;
      let word=req.body.givenWord;
      let rt=req.body.newRoot;
      let inf= word.replace(rt,'');
      let filter={serialNumber:sl};
      let update={
                    rootWord:rt,
                    inflection:inf,
                    // usernam:manush,
                    time:tarikh,
                    status:1
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
        let path="https://drive.google.com/drive/folders/1CcST75bVnnAOUkFC3M-9_Rd2R_Yy7BOE?usp=sharing";
        fs.writeFile(path+'/last10.csv',info,function(err){
        		if(err){
        			console.log(err);
        		}
        	});
			  });
        //csv file writtern
});
function getNumber(username){
	  Data.aggregate(
	  [
		{ "$match": { usernam: {  $eq: username } } },
		{"$group" : {_id:"$usernam", count:{$sum:1}}},
	  ]
	  ).exec((err, results) => {
		  if (err) throw err;
	  //  res.send(results[0]);
		return results[0][Object.keys(results[0])[1]];
	});
}

app.get('/stat',function(req,res){
      let u='sam74'

      Data.aggregate(
      [
        { "$match": { usernam: {  $ne: null } } },
        // {
        //  "$group" : {
        //     _id : { $dateToString: { format: "%Y-%m-%d", date: "$time"} },
        //     totalDays: { $sum: 1 }
        //   }
        // },
        {
          //{ $dateToString: { format: "%Y-%m-%d", date: "$date" } }
          "$group" : {
                _id:"$usernam" ,
                joined:{  $min:"$time" },
                totalDays:{$min:"9 Days"},
                totalHours:{$min:"18.6 hrs"},
                count:{$sum:{ $dateToString: { format: "%Y-%m-%d", date: "$date" } }},
                totalWords:{$count:{}}
              },
        },
        {
              $sort : { totalWords: -1 }
        }

    //   {"$project" : {user : '$_id.username', joined : '$_id.createdOn'}}
   //  {
   //  $group : {
   //     _id : { $dateToString: { format: "%Y-%m-%d", date: "$time" } }
   //   }
   // }
      ]
      ).exec((err, results) => {
          if (err) throw err;
    //      console.log(results);
    //    res.send(results);
      res.render('stats',{st:results});
      //  console.log(results[0][Object.keys(results[0])[1]]);
    //  console.log(results[0].count);
      //    console.log(results);
      });
    //  console.log(Group);
      // Group.aggregate([
      //   { "$match": { usernam: { $eq:"sam74" } } },
      // ],function(err,results){
      //   res.send(results);
      // });



  //  res.send('Insha-Allah I will show you the statistics');

});
app.post('/download',function(req,res){
			    let usr="sam74";
	        let dta=req.body.information;
        //  console.log(req.body);


          Data.aggregate(
          [
            { "$match": { usernam: {  $ne: null } } },
            {
              //{ $dateToString: { format: "%Y-%m-%d", date: "$date" } }
              "$group" : {
                    _id:"$usernam" ,
                    username:{$min:'$usernam'},
                    startedFrom:{  $min:{ $dateToString: { format: "%Y-%m-%d", date: "$time" } } },
                    totalDays:{$count:{}}, //count: { $count: { } }
                    totalHours:{$min:"_._ hrs"},
                    totalWords:{$sum:1}},
                    //totalWords:{$count:{}}
            // "$group" : {_id:"$usernam" ,started:{  $min:{ $dateToString: { format: "%Y-%m-%d", date: "$time" } } },totalDays:{$min:"_ Days"},totalHours:{$min:"_._ hrs"}, count:{$sum:1}},
            },
            {
                  $sort : { totalWords: -1 }
            }
            // {
            //  "$group" : {
            //     _id : { $dateToString: { format: "%Y-%m-%d", date: "$time"} },
            //     totalDays: { $sum: 1 }
            //   }
            // },

          ]
          ).exec((err, results) => {
              if (err) throw err;

              let jsonData= JSON.stringify(results);
            //  console.log(results);

              const fields = ['username','totalWords' ,'startedFrom'];
              const jsons2csvParser=new Parser({fields});
              const info = jsons2csvParser.parse(results);
            //  res.send(jsonData);
            let time=new Date();
            let date=time.getDate() + "-" + (parseInt( time.getMonth() )+parseInt('1'))+ "-" +time.getFullYear()
              let filename='userStatistics_'+date+'.csv'
              res.attachment(filename);
              res.status(200).send(jsons2csvParser.parse(results));
              let path="https://drive.google.com/drive/folders/1CcST75bVnnAOUkFC3M-9_Rd2R_Yy7BOE?usp=sharing";
              // fs.writeFile(path+'/last10.csv',info,function(err){
              // 		if(err){
              // 			console.log(err);
              // 		}
              // 	});


              //csv file writtern
          });

});
app.get('/admin-stat',function(req,res){    //joining two tables data and user
//   Data.aggregate([{
//     $lookup: {
//         from: "users", // collection name in db
//         localField: "usrnam",
//         foreignField: "username",
//         as: "createdOn"
//     }
// }]).exec(function(err, results) {
//   res.send(results);
//     // students contain WorksnapsTimeEntries
// });

});
app.post('/stat',function(req,res){
  if(req.isAuthenticated()&&req.user.status=="active"){
      let user=req.body.user;
      Data.aggregate(
      [
        { "$match": { usernam: {  $eq: user } } },
        {
         "$group" : {
            _id : { $dateToString: { format: "%Y-%m-%d", date: "$time"} },
            count: { $sum: 1 },
            cnt:{ $count:{}}
          }
        },
        {
          $sort : { _id: 1 }
        }
      ]
      ).exec((err, results) => {
          if (err) throw err;

          res.render('userStats',{data:results,usr:user});
      //    console.log(results);
      });
    }
  else{
    res.redirect('/admin-login');
  }

});

app.post('/downloadFile',function(req,res){
  let user=req.body.user;
  Data.aggregate(
  [
    { "$match": { usernam: {  $eq: user } } },
    {
     "$group" : {
        _id : { $dateToString: { format: "%Y-%m-%d", date: "$time"} },
        date:{$min:{ $dateToString: { format: "%Y-%m-%d", date: "$time"} }},
        wordCount: { $sum: 1 }
      }
    },
    {
      $sort : { _id: 1 }
    }
  ]
  ).exec((err, results) => {
      if (err) throw err;
      // res.render('userStats',{data:results,usr:user});
       const fields = ['date','wordCount'];
       const jsons2csvParser_=new Parser({fields});
       const info_ = jsons2csvParser_.parse(results);
    // //  res.send(jsonData);
       let time_=new Date();
       let date_=time_.getDate() + "-" + (parseInt( time_.getMonth() )+parseInt('1'))+ "-" +time_.getFullYear()
       let filename_=user+'_perdayStatistics_'+date_+'.csv'
       res.attachment(filename_);
       res.status(200).send(jsons2csvParser_.parse(results));

  });


});


app.get('/faq',function(req,res){
  res.render('faq');
});
async function restoreAll(fltr,updt) {
  try{
      await  Data.updateMany(fltr, {$set:updt}, {new: true}, (err, doc) => {});
        return doc.save();
  }
  catch(error){

  }
}
app.post('/restoreAll',function(req,res){
  const fltr={status : 2};   //from skipped
  const updt ={ status : 0};  // making incomplete
  restoreAll(fltr,updt);
  res.redirect('/skipped-words')
});


app.listen(process.env.PORT||3000,function(err){

  // Data.find({},function(err,results){
  //   for(let i=0; i<500; i++){
  //       console.log(results[i].serialNumber);
  //   }

  // });
  console.log('Alhamdulillah Server Started at '+new Date());
});
