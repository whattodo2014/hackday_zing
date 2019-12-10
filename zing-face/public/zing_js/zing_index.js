$(document).ready(function () {
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

window.zingLib = zingLib;

