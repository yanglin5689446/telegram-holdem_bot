const { setWebhook } = require('./app/api')
const express = require('express')
const app = express()
require('dotenv').config()

app.use(express.json())

app.post('/', function (req, res) {
  const update = require('./app/update')
  console.log(req.body)
  res.send(req.body)
  update(req.body)
})

app.listen(process.env.PORT, () => {
  console.log(`App listening at port: ${process.env.PORT}`)
  // setWebhook with empty param will reset webhook
  setWebhook({}).then(() =>
    setWebhook({ url: process.env.CALLBACK_URL })
      .then((response) => response.json())
      .then(console.log)
  )
})
