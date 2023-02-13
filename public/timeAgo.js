module.exports.timeSince=timeSince;
function timeSince(date) {

  const seconds = Math.floor((new Date() - date) / 1000);

  let interval = seconds / 31536000;

  if (interval > 1) {
    let year=Math.floor(interval);
    if(year==1){
        return year + " year ago";
    }
        
    else{
        return year + " years ago";
    }
   // return Math.floor(interval) + " years ago";
  }
  interval = seconds / 2592000;
  if (interval > 1) {
    let month=Math.floor(interval);
    if(month==1){
        return month + " month ago";
    }
        
    else{
        return month + " months ago";
    }
    // return Math.floor(interval) + " months ago";
  }
  interval = seconds / 86400;
  if (interval > 1) {
    let day=Math.floor(interval);
    if(day==1){
        return day + " day ago";
    }
        
    else{
        return day + " days ago";
    }
   // return Math.floor(interval) + " days ago";
  }
  interval = seconds / 3600;
  if (interval > 1) {
    let hour=Math.floor(interval);
    if(hour==1){
        return hour + " hour ago";
    }
        
    else{
        return hour + " hours ago";
    }
   // return Math.floor(interval) + " hours ago";
  }
  interval = seconds / 60;
  if (interval > 1) {
    let minute=Math.floor(interval);
    if(minute==1){
        return minute + " minute ago";
    }
        
    else{
        return minute + " minutes ago";
    }
   // return Math.floor(interval) + " minutes ago";
  }
  return "<sup>🟢</sup> just now";
}