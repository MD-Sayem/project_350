const passport = require('passport');
const express = require('express');
const router =  express.Router();
const User=require('../models/user');
const Data=require('../models/data')
const homeRouter =require('./home');

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
          console.log('admin logged in');
        }
        else{
              res.redirect('/home');
              console.log(req.user.username+' login done; working '+req.user.workingWith);
        }
      });
    }
  });

});
router.post('/logout', function(req, res, next) {

  //  console.log(req.user);
  //  if(req.user.workingWith!=null)
    {
      const filter={serialNumber:req.user.workingWith};
      const update={lock:0};
      Data.findOneAndUpdate(filter, {$set:update}, {new: true}, (err, doc) => {});
      let usr=req.user.username;
      User.findOneAndUpdate({username:usr},{workingWith:0},{new:true},(err,doc)=>{});
      console.log(req.user.username+" logged out and unlocked "+filter.serialNumber);
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
module.exports=router;