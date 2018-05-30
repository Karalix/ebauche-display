const express = require('express')
const secret = require('./secret/')

const app = express()

app.use(express.static('public'))
app.listen(3000, () => console.log('Example app listening on port 3000!'))

app.get('/couchdbURL', function (req, res) {
  res.send(secret.couchdbURL)
})