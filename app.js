const PORT = process.env.PORT || 8080

//requires
const path = require("path")
const fs = require("fs")
const express = require("express")
const { cookieParser } = require("./middleware/cookies.js")
require("dotenv").config

//paths
const insultsDataPath = path.join("data", "insults.json")
const booksDataPath = path.join("data", "books.json")

//app
const app = express()
app.use(express.static("public"))
app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }))

//insults data
const readInsultsFile = fs.readFileSync(insultsDataPath, { encoding: "utf-8" })
const insultsData = JSON.parse(readInsultsFile)

let insultId = 0
const insultsObjects = insultsData.insults
insultsObjects.forEach((insult) => (insult.id = insultId += 1))

const newJson = { insults: insultsObjects }
fs.writeFileSync(insultsDataPath, JSON.stringify(newJson))
const allInsults = insultsData.insults

//books data
const readBooksFile = fs.readFileSync(booksDataPath, { encoding: "utf-8" })
const booksData = JSON.parse(readBooksFile)
const allBooks = booksData.books

//functions
function getRandom(insultsArray) {
  const randomIndex = Math.floor(Math.random() * insultsArray.length)
  const randomInsult = insultsArray[randomIndex]
  return randomInsult
}

function findOriginId(origin) {
  let bookId = 0
  allBooks.forEach((book) => {
    if (origin.includes(book.title)) {
      bookId = book.id
    }
  })
  return bookId
}

//endpoints
app.use((req, res, next) => {
  if (req.headers.cookie != undefined) {
    req.cookies = cookieParser(req.headers.cookie)
  }
  //console.log(`Handling request to ${req.method} ${req.path}`)
  next()
})

app.get("/", function (req, res) {
  const randomInsult = getRandom(allInsults)
  const bookId = findOriginId(randomInsult.origin)

  res.render("layout", {
    page: "insult.ejs",
    insult: randomInsult,
    bookId,
    pageTitle: "Random insult",
    filtered: false,
    display: true,
  })
})

app.get("/search", function (req, res) {
  res.render("layout", { page: "search.ejs" })
})

app.get("/results", function (req, res) {
  const results = allInsults.filter((insult) =>
    insult.text.toLowerCase().includes(req.query.text.toLowerCase())
  )
  res.render("layout", { results, page: "results.ejs" })
})

app.get("/favorite", function (req, res) {
  const insult = allInsults.find((insult) => insult.id == req.cookies.favorite)
  const bookId = findOriginId(insult.origin)
  res.render("layout", {
    page: "insult.ejs",
    insult,
    bookId,
    pageTitle: "Favorite insult",
    filtered: false,
    display: false,
  })
})

app.post("/favorite", function (req, res) {
  const insultId = req.body.favorite
  res.set("Set-Cookie", `favorite=${insultId}`)

  res.redirect("/")
})

app.get("/create", function (req, res) {
  res.render("layout", { page: "create.ejs" })
})

app.post("/create", function (req, res) {
  const newId = allInsults[allInsults.length - 1].id + 1
  req.body.id = Number(newId)
  req.body.severity = Number(req.body.severity)
  allInsults.push(req.body)
  const updatedData = { insults: allInsults }
  fs.writeFileSync(insultsDataPath, JSON.stringify(updatedData))
  res.redirect("/create")
})

app.get("/edit/:id", function (req, res) {
  const currentInsult = allInsults.find((insult) => insult.id == req.params.id)
  res.render("layout", {
    page: "edit.ejs",
    insult: currentInsult,
  })
})

app.post("/edit/:id", function (req, res) {
  const editedInsult = allInsults.find((insult) => insult.id == req.params.id)
  const currentIndex = allInsults.indexOf(editedInsult)
  req.body.severity = Number(req.body.severity)
  req.body.id = Number(req.body.id)
  allInsults.splice(currentIndex, 1, req.body)

  const updatedData = { insults: allInsults }
  fs.writeFileSync(insultsDataPath, JSON.stringify(updatedData))

  res.redirect("/")
})

app.get("/:severity", function (req, res) {
  const matchingInsults = allInsults.filter(
    (insult) => insult.severity == req.params.severity
  )
  const randomInsult = getRandom(matchingInsults)
  const bookId = findOriginId(randomInsult.origin)

  res.render("layout", {
    page: "insult.ejs",
    insult: randomInsult,
    bookId,
    pageTitle: `Random insult filtered by severity 
    ${randomInsult.severity}`,
    filtered: true,
    display: true,
  })
})

app.get("/books/:id", function (req, res) {
  const book = allBooks.find((book) => book.id == req.params.id)
  res.render("layout", { page: "books.ejs", book: book })
})

// error handling
app.use(function (req, res) {
  res
    .status(404)
    .render("error.ejs", {
      message: "404: Page not found",
      title: "hej men nej",
    })
})

app.use(function (error, req, res, next) {
  let display = false
  let message = "Too much of an insult! Try again with a lower severity... jeez"
  if (req.path == "/favorite") {
    message = "No favorite insult yet. If you search you will find!"
  }
  if (req.path.includes("books")) {
    message = "Sorry, no details here..."
    display = true
  }
  res
    .status(500)
    .render("layout.ejs", {
      page: "error.ejs",
      message,
      title: "Oopz!",
      display,
    })
})

//listen
app.listen(PORT, () => {
  console.log(`Listening at http://localhost:${PORT}`)
})
