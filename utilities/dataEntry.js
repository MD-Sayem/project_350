const fs = require('fs');
const readline = require('readline');
const {readFileSync, promises: fsPromises} = require('fs');
const path = require('path');
const User=require('../models/user');
const Data=require('../models/data');

let inputFileName='try.txt';
let outputFileName="inesert5.json";

let warning="don't forget to add [] to make an array!"
const words=new Array();

Data.find({}).sort({serialNumber : -1}).limit(1).exec(function(err, maxResult){
  let i=maxResult[0].serialNumber;
  console.log(i);
  const file = readline.createInterface({
      input: fs.createReadStream('./datas/'+inputFileName),
      output: process.stdout,
      terminal: false
  });
      file.on('line', (line) => {

        const data={
        serialNumber : ++i,
        word : line,
        status:0,
        lock:0
       };
       //save the data if the datase is small

       // words.push(data);
       // fs.appendFileSync('./datas/'+outputFileName, JSON.stringify(data, null, "\t"));
       // fs.appendFileSync('./datas/'+outputFileName, ","+"\n");
    });
});
