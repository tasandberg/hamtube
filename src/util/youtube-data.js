import "whatwg-fetch"
const { fetch } = window

export const extractVideoId = (url) => {
  var regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/
  var match = url.match(regExp)
  if (match && match[7].length === 11) {
    return match[7]
  } else {
    alert("Could not extract video ID.")
  }
}
export const extractVideoData = (videoId) => {
  const opts = {
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  }
  return fetch(
    `https://www.youtube.com/oembed?url=http://www.youtube.com/watch?v=${videoId}&format=json`
  ).catch((e) => console.log(e))
}
