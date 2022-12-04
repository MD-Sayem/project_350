const express = require('express');
const router =  express.Router();
const Data = require('../models/data');
const User=require('../models/user');

router.get('/data-stat',function(req,res){

  if(req.isAuthenticated() && req.user.role=='admin'){

        let user=req.user.username;
        Data.aggregate(
        [
          {
           "$group" : {
              _id : "$status",
              count: { $sum: 1 }
            }
          },
          {
            $sort : { _id: 1 }
          }
        ]
        ).exec((err, results) => {
            if (err) throw err;

            res.render('dataStat',{stat:results});
          //  res.send(results);
            // let size=Object.objsize(results);
          //  console.log(results.length);
          //  console.log(results[0]._id);
        });
     }  
     else{
         res.redirect('/admin-login');
       }


});




module.exports=router;
