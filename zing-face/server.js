const express = require('express')
const path = require('path')
const { get } = require('request')
const { readFile, writeFile } = require('fs')

const app = express()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const viewsDir = path.join(__dirname, 'views')
app.use(express.static(viewsDir))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.static(path.join(__dirname, 'images')))
app.use(express.static(path.join(__dirname, 'media')))
app.use(express.static(path.join(__dirname, 'weights')))
app.use(express.static(path.join(__dirname, 'dist')))
app.use(function (req, res, next) {
  if (req.url.startsWith('/img/') || req.url.startsWith('/fonts/') || req.url.startsWith('/data/')) {
    req.url = `/public${req.url}`;
  }
  next();
});

app.get('/', (req, res) => res.redirect('/face_detection'))
app.get('/index', (req, res) => res.sendFile(path.join(viewsDir, 'index.html')))
app.get('/details', (req, res) => res.sendFile(path.join(viewsDir, 'details.html')))

const readFileAsync = (filePath = path.join(__dirname, "./public/data/zing-books.json")) => new Promise(resolve => readFile(filePath, (err, data) => resolve(!err && data)));
const writeFileAsync = (content, filePath = path.join(__dirname, "./public/data/zing-books.json")) => new Promise(resolve => writeFile(filePath, content, resolve));

const actions = Object.freeze({
  borrow: "borrow",
  return: "return",
  share: "share"
});

const dbAsyncHandler = zingBooks => Object.freeze({
  [actions.borrow]: async (userName, bookId) => {
    const { books, userBorrow } = zingBooks;
    const targetBook = books[bookId];
    if (!targetBook || !targetBook.available) {
      return false;
    }

    targetBook.available = false;
    const targetUser = userBorrow[userName];
    if (!targetUser) {
      userBorrow[userName] = {
        [bookId]: new Date().toDateString()
      }
    } else {
      userBorrow[userName] = {
        ...targetUser,
        [bookId]: new Date().toDateString()
      }
    }

    const err = await writeFileAsync(JSON.stringify({ ...zingBooks, books, userBorrow }));
    if (err) {
      return false;
    }

    return true;
  },
  [actions.return]: async (userName, bookId) => {
    const { books, userBorrow } = zingBooks;
    const targetBook = books[bookId];
    const targetUser = userBorrow[userName];
    if (!targetUser || !targetBook || targetBook.available) {
      return false;
    }

    delete targetUser[bookId];
    targetBook.available = true;

    const err = await writeFileAsync(JSON.stringify({ ...zingBooks, books, userBorrow }));
    if (err) {
      return false;
    }

    return true;
  },
  [actions.share]: async (userName, bookId, bookName, bookDetails) => {
    const { books } = zingBooks;
    const targetBook = books[bookId];
    if (targetBook) {
      return false;
    }

    books[bookId] = {
      available: true,
      details: [
        bookName,
        ...bookDetails
      ]
    }

    const err = await writeFileAsync(JSON.stringify({ ...zingBooks, books }));
    if (err) {
      return false;
    }

    return true;
  }
});

app.post('/details/:userName/:action', async (req, res) => {
  const { userName, action: actionName } = req.params;
  if (!actions[actionName]) {
    return res.status(400).send('action not valid')
  }

  try {
    const { bookName, bookId, bookDetails } = req.body;

    const zingBooksStr = await readFileAsync();
    const zingBooks = JSON.parse(zingBooksStr);
    const handler = dbAsyncHandler(zingBooks)[actionName];
    const success = await handler(userName, bookId, bookName, bookDetails);

    return res.send({ success })
  } catch (err) {
    return res.status(500).send('internal error')
  }
});

app.post('/fetch_external_image', async (req, res) => {
  const { imageUrl } = req.body
  if (!imageUrl) {
    return res.status(400).send('imageUrl param required')
  }
  try {
    const externalResponse = await request(imageUrl)
    res.set('content-type', externalResponse.headers['content-type'])
    return res.status(202).send(Buffer.from(externalResponse.body))
  } catch (err) {
    return res.status(404).send(err.toString())
  }
})

app.listen(3000, () => console.log('Listening on port 3000!'))

function request(url, returnBuffer = true, timeout = 10000) {
  return new Promise(function (resolve, reject) {
    const options = Object.assign(
      {},
      {
        url,
        isBuffer: true,
        timeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36'
        }
      },
      returnBuffer ? { encoding: null } : {}
    )

    get(options, function (err, res) {
      if (err) return reject(err)
      return resolve(res)
    })
  })
}