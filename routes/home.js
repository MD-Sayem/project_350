const express = require('express');
const router =  express.Router();
const Data = require('../models/data');
const User=require('../models/user');


async function update_(no, uname){
  try{
    await User.findOneAndUpdate({username:uname}, //give up the lock
    {$set:{workingWith:no}},
     {new: true}, (err, doc) => {
    // console.log('nowWorkingWith the word: '+doc);
      doc.save();
     });
  }
  catch(error){

  }
}

router.get('/home',function(req,res){
  // find one from the database where status==0 and lock==0
  // set lock=1;
 if(req.isAuthenticated()&&req.user.status=="active" && req.user.role!="admin"){
    let number=req.user.workingWith;
//    console.log(req.user.username+' working with word no: '+number);
    // console.log('previousWorkedWith : '+number);
    if(number!=0){
      Data.findOne({serialNumber:number},function(err,result){
        if(err){
          console.log(err);
        }
          res.render("data_entry_screen" , {wd:result,me:req.user});
      });
    }
  else{ //workingWith==0
    let sobdo=new Data();
    uname=req.user.username;
    let filter={lock:0, status:1, usernam: {$ne : uname}};  //{'team': {$ne : "Mavs"}}
      let update={lock:1}



      Data.findOneAndUpdate(filter, {$set:update}, {new: true}, (err, doc) => {
        if (err) {
            console.log(req.user.username +" had Something wrong when finding word!!");
        }
        if(doc!=null){
          doc.save();
          req.user.workingWith=doc.serialNumber;

          
        //  console.log('the number is '+number);
          let no=doc.serialNumber;
          let uname=req.user.username;
          update_(no, uname);
            res.render("data_entry_screen" , {wd:doc,me:req.user});
        //  console.log(req.user);
        }
        else{    //when the dataset is finished all skipped words are marked as incomplete
          const fltr={status : 2};   //from skipped
          const updt ={ status : 0};  // making incomplete
          Data.updateMany(fltr, {$set:updt}, {new: true}, (err, doc) => {});
          res.send('<h1>ডেটা_শেষ_হয়ে_গেছে !</h1>');


        }
        });
  }

}
  else{
    res.redirect('/')
  }

});

module.exports=router;
