const express = require('express');
const router =  express.Router();
const Data = require('../models/data');
const User=require('../models/user');
const timeAgo=require("../public/timeAgo.js");
router.get('/leaderboard',function(req,res){
    if(req.isAuthenticated()){
            let u='sam74'

        Data.aggregate(
        [
        { "$match": { usernam1: {  $ne: null } } },
        {
            "$group" : {
                _id:"$usernam1" ,
                joined:{  $min:"$time1" },
                last:{  $max:"$time1" },
                totalDays:{$min:"9 Days"},
                totalHours:{$min:"18.6 hrs"},
                count:{$sum:{ $dateToString: { format: "%Y-%m-%d", date: "$date1" } }},
                totalWords:{$count:{}}
                },
        },
        {
                $sort : { totalWords: -1 }
        }

        ]
        ).exec((err, results) => {
            if (err) throw err;
        res.render('leaderboard',{st:results,timePasted:timeAgo});
        });
    }
    else{
        res.render('/');
    }

});

module.exports=router;