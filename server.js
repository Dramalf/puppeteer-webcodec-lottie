const puppeteer = require('puppeteer-core')
const express = require('express');
const spawn = require('await-spawn')
const fs = require('fs')
const { request } = require('urllib');


const app = express();
const isDev = process.platform === 'darwin';
const chromePath = isDev
  ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  : `${process.cwd()}/../chromium/chrome`



app.use('/web', express.static(__dirname + '/public'));

app.get('/', (req, res) => {
  res.send('NodeJS Drama Lottie to Video use <a href="http://localhost:8000/web">puppeteer WebCodec Lottie-Web</a><br/>go to <a href="http://localhost:8000/dramaLottie" target="_blank">here</a>');
});
app.get('/dramaLottie', async (req, res) => {
  const testLottieUrl = 'https://slobs-cdn.oss-cn-hangzhou.aliyuncs.com//star-cloud/schema/1682235940673.json';
  const lottieObj = await request(testLottieUrl).then(res => res.data).then(res => JSON.parse(res))
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
  console.log(`页面加载时间 ${(Date.now() - loadStartTime) / 1000}`)
  const h264BinStr = await page.evaluate(
    async (path) =>
      await window.lottie2video(path),
    lottieObj
  )
  const fileName = './test'
  const h264FilePath = `${fileName}.h264`
  const mp4FilePath = `${fileName}.mp4`

  await fs.promises.writeFile(h264FilePath, h264BinStr, 'binary')

  await spawn(
    'ffmpeg',
    `-i ${h264FilePath} -movflags faststart -c copy -y ${mp4FilePath}`.split(
      /\s+/
    )
  )
  console.log(`任务总时长 ${(Date.now() - loadStartTime) / 1000}`)
  console.log('finish')
  fs.unlinkSync(h264FilePath);
  res.send('finish')
});
app.listen(8000, () => {
  console.log('App listening on ', 'http://localhost:8000');
});