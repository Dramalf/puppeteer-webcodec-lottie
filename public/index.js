window.lottie2video = async (template) => {
    const { w, h, fr: fps } = template;
    // const canvas=document.getElementById('dc');
    const canvas = document.createElement('canvas')//new OffscreenCanvas(w, h);

    // document.body.appendChild(canvas)
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    var x = canvas.width / 2;
    var y = canvas.height / 2;
    var r = 50;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = "red";
    ctx.fill();
    const anim = lottie.loadAnimation({
        container: document.getElementById('box'),
        renderer: 'canvas',
        loop: false,
        autoplay: false,
        animationData: template,
        // rendererSettings: {
        //     context: ctx,
        //     scaleMode: "noScale",
        //     clearCanvas: true
        // }
    }
    )
    window.anim = anim;
    const frameNum = anim.getDuration(true);
    const framesList = [];
    await new Promise(resolve => {
        anim.addEventListener('DOMLoaded', resolve);
    })
    console.log('loaded')
    const res = await new Promise((resolve, reject) => {
        const encoder = new VideoEncoder({
            output: encodedFrame => {
                framesList.push(encodedFrame);
                if (framesList.length >= frameNum) {
                    readVideoFrames(framesList, resolve)
                }
            },
            error: err => console.err
        })
        encoder.configure({
            codec: "avc1.420028",
            width: w,
            height: h,
            framerate: fps,
            hardwareAcceleration: "prefer-software",
            avc: { format: "annexb" }
        });
        for (let i = 0; i < frameNum; i++) {
            anim.goToAndStop(i, true);
            // const data = anim.container.getContext('2d').getImageData(0, 0, anim.container.width, anim.container.height);
            // console.log(data.data)
            const frame = new VideoFrame(anim.container, { timestamp: 1e6 / fps * i });
            encoder.encode(frame);
            frame.close();
        }
        encoder.flush();
    })
    return res
}
function readVideoFrames(frames, callback) {
    const buffers = createArrayBuffers(frames);
    const blob = new Blob(buffers, { type: 'video/h264' });
    const reader = new FileReader();
    reader.readAsBinaryString(blob);
    reader.onload = () => callback(reader.result);
}
function createArrayBuffers(frames) {
    return frames.map(frame => {
        const buffer = new ArrayBuffer(frame.byteLength);
        frame.copyTo(buffer);
        return buffer;
    });
}

