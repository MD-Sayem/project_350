const passport = require('passport');
const express = require('express');
const router =  express.Router();
const User=require('../models/user');
const Data=require('../models/data')
const homeRouter =require('./home');
const activeDeactiveRouter=require('./activeDeactive');
const gerbageRouter=require('./gerbage');
const skippedRouter=require('./skipped');
const myStatRouter=require('./myStat');
const dataStatRouter=require('./dataStat');
const leaderboardRouter = require('./leaderboard');
const perDayRouter=require('./perDay');
const downloadPerDayRouter=('./downloadPerDay');
const myDayRouter=('./myDay');
// router.get('/',function(req,res){
//   res.redirect('/login');
//res.send('welcome to login');

// });
router.get('/',function(req,res){
  res.render('index');
});

router.post('/login', function(req, res){

  const user = new User({
    username: req.body.username,
    password: req.body.password
  });

  req.login(user, function(err){
    if (err) {
      console.log(err);
      res.render('index');
    } else {
      passport.authenticate("local")(req, res, function(){
        if(user.username=='admin_101'||user.role=='admin'){
          res.redirect('/stat');
        //  console.log('admin logged in');
        }
        else{
              res.redirect('/home');
            //  console.log(req.user.username+' login done; working '+req.user.workingWith);
        }
      });
    }
  });

});
router.post('/logout', function(req, res, next) {

  //  console.log(req.user);
    if(req.isAuthenticated())
    {
      const filter={serialNumber:req.user.workingWith};
      const update={lock:0};
      Data.findOneAndUpdate(filter, {$set:update}, {new: true}, (err, doc) => {});
      let usr=req.user.username;
      User.findOneAndUpdate({username:usr},{workingWith:0},{new:true},(err,doc)=>{});
    //  console.log(req.user.username+" logged out and unlocked "+filter.serialNumber);
    }
    req.logout(function(err) {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });

});
// router.get('/home',function(req,res){
//   res.send('Wrong home page');
// });
router.get('/home',homeRouter);
router.get('/activeDeactive',activeDeactiveRouter);
router.post('/activeDeactive',activeDeactiveRouter);
router.get('/garbage-words',gerbageRouter);
router.get('/skipped-words',skippedRouter);
router.get('/my-stat',myStatRouter);
router.get('/data-stat',dataStatRouter);
router.get('/leaderboard',leaderboardRouter);
router.get('/per-day-stat',perDayRouter);
// router.get('/myDay',myDayRouter);
//router.get('/download-per-day',downloadPerDayRouter);
module.exports=router;
