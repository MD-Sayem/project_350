const passport = require('passport');
const express = require('express');
const router =  express.Router();
const User=require('../models/user');
const Data=require('../models/data')

let filter={username:{ne:"admin_101"}};
router.get("/activeDeactive",function(req,res){
  User.find(filter,function(err,results){
    res.render('activeDeactive',{users:results});
  }).sort({ createdOn: 1 });
});


module.exports=router;
