const express = require('express');
const router =  express.Router();
const Data = require('../models/data');
const User=require('../models/user');

router.get('/my-stat',function(req,res){
  let user=req.user.username;
  Data.aggregate(
  [
    { "$match": { usernam: {  $eq: user } } },
    {
     "$group" : {
        _id : { $dateToString: { format: "%Y-%m-%d", date: "$time"} },
        count: { $sum: 1 }
      }
    },
    {
      $sort : { _id: -1 }
    }
  ]
  ).exec((err, results) => {
      if (err) throw err;

      res.render('myStat',{data:results,usr:user});
  });

});;






module.exports=router;
