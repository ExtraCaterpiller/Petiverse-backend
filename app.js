const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require("cors")

const errormiddleware = require('./middlewares/error')

if (process.env.NODE_ENV !== "PRODUCTION") {
    require('dotenv').config({ path: ".env" })
}

// Allow requests from the frontend
app.use(cors({
    origin: "*",
    methods: 'GET,POST,PUT'
}));
app.use(express.json())

// Routes import
const nftRoutes = require('./routes/nftRoute')

app.use('/api/v1', nftRoutes)

app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(errormiddleware)

module.exports = app