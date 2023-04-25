# puppeteer-webcodec-lottie

Use puppeteer in nodejs using webcodec to convert lottie file to mp4 video

lottie --> load in puppeteer lottie-web --> encode each frame by VideoEncoder and VideoFrame --> frames-buffer-blob-file --> send back to nodejs --> use ffmpeg generate video

## demo

* `npm i `
* `node server.js`  the demo runs on http://localhost:8000/
* paste your own lottiefile-json-url (default is https://assets7.lottiefiles.com/private_files/lf30_obidsi0t.json, you can find some on https://lottiefiles.com )
* then click `convert` button, jump to http://localhost:8000/dramaLottie and wait for video generation
* it takes few seconds to convert such a lottie below

https://user-images.githubusercontent.com/43701793/234198118-7c04901c-f347-4f41-aafc-7b1a15a11066.mp4
