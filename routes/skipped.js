const passport = require('passport');
const express = require('express');
const router =  express.Router();
const User=require('../models/user');
const Data=require('../models/data')


router.get('/skipped-words',function(req,res){

  if(req.isAuthenticated()&&(req.user.username=='admin_101'||req.user.role=='admin')){

    let usr=req.user.username;
      Data
      .find({status: 2})
      .sort({'time': -1})
      .limit(10)
      .exec(function(err, posts) {
        res.render('admin',{sobdo:posts,who:usr,page:"incomplete"});
           // `posts` will be of length 20
      });
  }
  else{
    res.redirect('/admin-login');
  }

});

module.exports=router;
