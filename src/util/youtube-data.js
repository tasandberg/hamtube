import axios from "axios";

const urlRegex = /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/;

export const extractVideoId = (url) => {
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  var match = url.match(regExp);
  if (match && match[7].length === 11) {
    return match[7];
  } else {
    alert("Could not extract video ID.");
  }
};
export const extractVideoData = (videoUrl) => {
  return axios(`https://noembed.com/embed?url=${videoUrl}&format=json`, {
    headers: {
      "Content-Type": "text/plain",
    },
  }).catch((e) => console.log("wow"));
};

export const validUrl = (url) => {
  return urlRegex.test(url);
};
