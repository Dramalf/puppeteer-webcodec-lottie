const puppeteer = require('puppeteer-core')
const express = require('express');
const spawn = require('await-spawn')
const fs = require('fs')
const path = require('path')
const axios = require('axios')


const app = express();
const isDev = process.platform === 'darwin';
const chromePath = isDev
  ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  : `${process.cwd()}/path/to/chromium/chrome`



app.use('/web', express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.send(`
  <html>

  <head>
      <title>Lottie-2-Video</title>
  </head>
  
  <body>
      NodeJS convert Lottie to Video using <b>puppeteer_webcodec_lottie-web</b>
      <br />
      check demo
      <input id="url-input"
       value="https://assets7.lottiefiles.com/private_files/lf30_obidsi0t.json"
       style="width:500px;"
       ></input>
      <button onclick="convert()">convert</button>
  </body>
  <script>
  function convert(){
    const url=document.getElementById('url-input').value;
    window.location.href = '/dramaLottie?lottie='+url;
  }
  </script>
  
  </html>
  `)
});
app.get('/dramaLottie', async (req, res) => {
  const testLottieUrl = req.query.lottie;
  const lottieObj = await axios.get(testLottieUrl).then(res => res.data).catch(err=>{
    res.send("error, fail to fetch lottie")
  })
  const htmlUrl = 'http://localhost:8000/web'
  const args = isDev ? [
    '--disable-web-security', // 本地 避免cors报错
    '--disable-features=IsolateOrigins',
    '--disable-site-isolation-trials',
    // '--auto-open-devtools-for-tabs'
  ] : [
    '--no-sandbox',
    '--no-zygote',
    '--single-process',
    '--disable-web-security',
    '--disable-features=IsolateOrigins',
    '--disable-site-isolation-trials', // bypass cors https://stackoverflow.com/questions/52129649/puppeteer-cors-mistake
    '--disk-cache-size=2147483647',
  ]
  const browser = await puppeteer.launch({
    userDataDir: '/tmp',
    executablePath: chromePath,
    ignoreDefaultArgs: ['--disable-dev-shm-usage'],
    args,
  });
  const page = (await browser.pages())[0];
  const loadStartTime = Date.now()
  await page.goto(htmlUrl);
  await page.waitForFunction('typeof window.lottie2video === "function"')
  const h264BinStr = await page.evaluate(
    async (path) =>
      await window.lottie2video(path),
    lottieObj
  )
  const fileName = './test'
  const h264FilePath = `${fileName}.h264`
  const mp4FilePath = `./public/${fileName}.mp4`

  await fs.promises.writeFile(h264FilePath, h264BinStr, 'binary')

  await spawn(
    'ffmpeg',
    `-i ${h264FilePath} -movflags faststart -c copy -y ${mp4FilePath}`.split(
      /\s+/
    )
  )
  console.log(`任务总时长 ${(Date.now() - loadStartTime) / 1000}`)
  fs.unlinkSync(h264FilePath);
  res.sendFile(path.join(__dirname, 'public', `${fileName}.mp4`));
});
app.listen(8000, () => {
  console.log('App listening on ', 'http://localhost:8000');
});