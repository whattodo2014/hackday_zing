let faceMatcher = null

async function updateResults() {
    if (!isFaceDetectionModelLoaded()) {
        return
    }

    /*
    const inputImgEl = $('#inputImg').get(0)

    const options = getFaceDetectorOptions()
    const results = await faceapi
        .detectAllFaces(inputImgEl, options)
        .withFaceLandmarks()
        .withFaceDescriptors()

    drawFaceRecognitionResults(results)
*/
    const options = getFaceDetectorOptions()
    const videoEl = document.getElementById('inputVideo')
    
    const results = await faceapi
        .detectAllFaces(videoEl, options)
        .withFaceLandmarks()
        .withFaceDescriptors()

    var resultLabels = drawFaceRecognitionResults(results, videoEl)
    updateLabelToUI(resultLabels, $('#recoged_name_elem').get(0))
}

async function onPlay(videoEl) {
    if (!videoEl.currentTime || videoEl.paused || videoEl.ended || !isFaceDetectionModelLoaded())
        return setTimeout(() => onPlay(videoEl))


    const options = getFaceDetectorOptions()

    const ts = Date.now()

    /*
    const drawBoxes = withBoxes
    const drawLandmarks = withFaceLandmarks
  */
    // let task = faceapi.detectAllFaces(videoEl, options)
    // task = withFaceLandmarks ? task.withFaceLandmarks() : task
    // const results = await task

    const results = await faceapi
        .detectAllFaces(videoEl, options)
        .withFaceLandmarks()
        .withFaceDescriptors()

    var resultLabels = drawFaceRecognitionResults(results, videoEl)
    updateLabelToUI(resultLabels, $('#recoged_name_elem').get(0))
    /*
      updateTimeStats(Date.now() - ts)
    
      const canvas = $('#overlay').get(0)
      const dims = faceapi.matchDimensions(canvas, videoEl, true)
    
      const resizedResults = faceapi.resizeResults(results, dims)
      if (drawBoxes) {
        faceapi.draw.drawDetections(canvas, resizedResults)
      }
      if (drawLandmarks) {
        faceapi.draw.drawFaceLandmarks(canvas, resizedResults)
      }
    */
    setTimeout(() => onPlay(videoEl))
}

function drawFaceRecognitionResults(results, videoEl) {
    const canvas = $('#overlay').get(0)
    /*
    const inputImgEl = $('#inputImg').get(0)
  
    faceapi.matchDimensions(canvas, inputImgEl)
    // resize detection and landmarks in case displayed image is smaller than
    // original size
    const resizedResults = faceapi.resizeResults(results, inputImgEl)
    */

    const dims = faceapi.matchDimensions(canvas, videoEl, true)
    const resizedResults = faceapi.resizeResults(results, dims)
    var resultLabels = []
    resizedResults.forEach(({ detection, descriptor }) => {
        const label = faceMatcher.findBestMatch(descriptor).toString()
        const options = { label }
        const drawBox = new faceapi.draw.DrawBox(detection.box, options)
        drawBox.draw(canvas)

        if (label) {
            resultLabels.push(label)
        }
    })

    return resultLabels
}

function updateLabelToUI(resultLabels, containerElement) {
    if (!resultLabels || resultLabels.length == 0 || !containerElement) {
        return
    }

    var label = resultLabels[0]

    if (!label || label == "") {
        return
    }

    label = label.substring(0, label.indexOf(' '))
    if (label !== "unknown" && label !== "") {
        containerElement.innerHTML = label;
    }
}

async function run() {
    // load face detection, face landmark model and face recognition models
    await changeFaceDetector(selectedFaceDetector)
    await faceapi.loadFaceLandmarkModel('/')
    await faceapi.loadFaceRecognitionModel('/')

    // initialize face matcher with 1 reference descriptor per bbt character
    faceMatcher = await createBbtFaceMatcher(1)

    // start processing image
    //rongji
    // updateResults()

    changeInputSize(416)

    // start processing frames
    //onPlay($('#inputVideo').get(0))

    // try to access users webcam and stream the images
    // to the video element
    const videoEl = document.getElementById('inputVideo')
    navigator.getUserMedia(
        { video: {} },
        stream => videoEl.srcObject = stream,
        err => console.error(err)
    )
}

var videoElement = document.querySelector('video');
var videoSelect = document.querySelector('select#videoSource');

videoSelect.onchange = getStream;

getStream().then(getDevices).then(gotDevices);

function getDevices() {
    // AFAICT in Safari this only gets default devices until gUM is called :/
    return navigator.mediaDevices.enumerateDevices();
}

function gotDevices(deviceInfos) {
    window.deviceInfos = deviceInfos; // make available to console
    console.log('Available input and output devices:', deviceInfos);
    for (const deviceInfo of deviceInfos) {
        const option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || `Camera ${videoSelect.length + 1}`;
            videoSelect.appendChild(option);
        }
    }
}

function getStream() {
    if (window.stream) {
        window.stream.getTracks().forEach(track => {
            track.stop();
        });
    }
    const videoSource = videoSelect.value;
    const constraints = {
        video: { deviceId: videoSource ? { exact: videoSource } : undefined }
    };
    return navigator.mediaDevices.getUserMedia(constraints).
        then(gotStream).catch(handleError);
}

function gotStream(stream) {
    window.stream = stream; // make stream available to console

    videoSelect.selectedIndex = [...videoSelect.options].
        findIndex(option => option.text === stream.getVideoTracks()[0].label);
    videoElement.srcObject = stream;
}

function handleError(error) {
    console.error('Error: ', error);
}

$(document).ready(function () {
    // renderNavBar('#navbar', 'bbt_face_recognition')
    // initImageSelectionControls()
    initFaceDetectionControls();
    run();
    barcodeHandler.init();
    bookHandler.loadBookInfo();
})

var barcodeHandler = (function() {
    var BarcodesScanner = {
        barcodeData: '',
        deviceId: '',
        symbology: '',
        timestamp: 0,
        dataLength: 0
    };
    
    BarcodesScanner.tmpTimestamp = 0;
    BarcodesScanner.tmpData = '';
    
    function debounce(func) {
        var wait = arguments.length <= 1 || arguments[1] === undefined ? 100 : arguments[1];
    
        var timeout = void 0;
        return function () {
            var _this = this;
    
            for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
            }
    
            clearTimeout(timeout);
            timeout = setTimeout(function () {
                func.apply(_this, args);
            }, wait);
        };
    }
    
    var handleBancodeChange = async () => {
        var barcode = BarcodesScanner.tmpData;
        console.log(barcode);
        var bookInfo = bookHandler.getBookInfo(barcode);
        if (!bookInfo) {
            bookInfo = await bookHandler.getBookInfoForWeb(barcode);
        }
        var bookInfoText = bookInfo ? bookInfo.details.join('</br>') : barcode;
        document.querySelector("#book_info").innerHTML = bookInfoText;
    };
    
    const barcodeChange = debounce(handleBancodeChange, 200);
    
    const init = () => {
        $(document).on('keypress', function (e) {
            e.stopPropagation();
            if (BarcodesScanner.tmpTimestamp < Date.now() - 500) {
                BarcodesScanner.tmpData = '';
                BarcodesScanner.tmpTimestamp = Date.now();
            }
            if (e.charCode && e.charCode > 0) {
                BarcodesScanner.tmpData += String.fromCharCode(e.charCode);
            }
            // var keycode = (e.keyCode ? e.keyCode : e.which);
            // if (keycode == 13 && BarcodesScanner.tmpData.length > 0){
            //     onScannerNavigate(BarcodesScanner.tmpData, 'FAKE_SCANNER', 'WEDGE', BarcodesScanner.tmpTimestamp, BarcodesScanner.tmpData.length);
            //     BarcodesScanner.tmpTimestamp = 0;
            //     BarcodesScanner.tmpData = '';
            // }          
            barcodeChange();
        });
    };

    return {
        init
    };
})();

var bookHandler = (function(){
    var books = {};
    var loadBookInfo = () => {
        $.getJSON("/data/zing-books.json", function(data) {
            books = data.books;
            console.log(books);
        });
    };

    var getBookInfo = (id) => {
        return books[id];
    };

    var getBookInfoForWeb = async (id) => {
        var url = "https://www.googleapis.com/books/v1/volumes?q=isbn:" + id;
        var response = await fetch(url, {credentials: 'include'});
        var jsonResult = await response.json();
        try {
            var info = jsonResult.items[0].volumeInfo;
            var textSnippet = jsonResult.items[0].searchInfo.textSnippet;
            var title = info.title;
            var authors = info.authors.join(', ');
            var description = info.description;
            var arr = [];
            arr.push(title);
            arr.push(authors);
            arr.push(description);
            arr.push(textSnippet);
            return {details: arr};
        }
        catch (e) {
            return "";
        }
    };
    return {
        loadBookInfo,
        getBookInfo,
        getBookInfoForWeb,
    };
})();

var zingLib = (function(){
    var borrow = () => {
        
        console.log();
    };
    return {
        borrow
    };
})();

