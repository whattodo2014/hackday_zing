  async function run() {
    // load the models
    //await faceapi.loadMtcnnModel('/')
    //await faceapi.loadFaceRecognitionModel('/')
    
    // try to access users webcam and stream the images
    // to the video element
    const videoEl = document.getElementById('inputVideo')
    navigator.getUserMedia(
      { video: {} },
      stream => videoEl.srcObject = stream,
      err => console.error(err)
    )
  }

  async function onPlay() {
      console.log('onPlay() exec');
    /*
    const videoEl = $('#inputVideo').get(0)

    if(videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
      return setTimeout(() => onPlay())


    const options = getFaceDetectorOptions()

    const ts = Date.now()

    const result = await faceapi.detectSingleFace(videoEl, options).withFaceExpressions()

    updateTimeStats(Date.now() - ts)

    if (result) {
      const canvas = $('#overlay').get(0)
      const dims = faceapi.matchDimensions(canvas, videoEl, true)

      const resizedResult = faceapi.resizeResults(result, dims)
      const minConfidence = 0.05
      if (withBoxes) {
        faceapi.draw.drawDetections(canvas, resizedResult)
      }
      faceapi.draw.drawFaceExpressions(canvas, resizedResult, minConfidence)
    }

    setTimeout(() => onPlay())
    */
  }
  
  export { run, onPlay };