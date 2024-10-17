//console.log("hello world");
require('dotenv').config()
const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/about', (req, res) => {
  res.send('<h1>About Page</h1>About Page')
})

app.get('/contact', (req, res) => {
  res.send('Contact Page')
})

app.listen(process.env.PORT, () => {
  console.log(`Example app listening on port ${port}!`)
})
