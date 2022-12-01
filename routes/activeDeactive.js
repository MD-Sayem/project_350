const passport = require('passport');
const express = require('express');
const router =  express.Router();
const User=require('../models/user');
const Data=require('../models/data')

async function toggle(usr) {
  try{
    await User.findOne({username:usr})
              .exec(function(err,user){
                         if(user.status=="active")
                            {
                              user.status='inactive';
                            }
                          else{
                            user.status='active';
                          }

                         user.save();
                       });
    return;
  }
  catch(error){

  }
}

let filter={username:{$ne:"admin_101"}};
router.get("/activeDeactive",function(req,res){
  User.find(filter,function(err,results){
    res.render('activeDeactive',{users:results});
  //  console.log(results);
  })    //.sort({ createdOn: 1 });
});

router.post("/activeDeactive",function(req,res){
  let usr =req.body.userN;
  toggle(usr);
  res.redirect('/activeDeactive');
});


module.exports=router;
