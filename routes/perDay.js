const express = require('express');
const router =  express.Router();
const Data = require('../models/data');
const User=require('../models/user');

router.get('/per-day-stat',function(req,res){
  let user=req.user.username;
  Data.aggregate(
  [
    { "$match": { usernam1: {  $ne: null } } },
    {
     "$group" : {
        _id : { $dateToString: { format: "%Y-%m-%d", date: "$time1"} },
        // max:{ $max: "$usernam"}, 
        count: { $sum: 1 },
      }
    },
    {
      $sort : { _id: -1 }
    }
  ]
  ).exec((err, results) => {
      if (err) throw err;

      res.render('perDayStat',{data:results,usr:user});
  });

});;






module.exports=router;
