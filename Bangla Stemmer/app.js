
const express = require('express');
const bodyParser = require('body-parser');

const app =express();
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine' , 'ejs');
app.use(express.static('public'));

app.get('/',function(req,res){
  res.render('index');
});
app.post('/login',function(req,res){
  res.render('data_entry_screen');
});
app.get('/admin-login',function(req,res){
  res.render('admin_login')
});
app.post('/admin-login',function(req,res){
  res.render('admin.ejs')
});
app.get('/logout',function(req,res){
  //req.logout();
  res.redirect('/');
});
app.listen(3000,function(err){
  console.log('Alhamdulillah Server Started on the port 3000');
});
