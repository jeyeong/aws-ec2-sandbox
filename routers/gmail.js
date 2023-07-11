const express = require('express')
const { google } = require('googleapis')
const axios = require('axios')

const {
  generateGoogleRequestForAxios,
  generateGmailWatchRequestForAxios,
} = require('../utils/requestGenerators')
const { domainToUse } = require('../constants')

// Router.
const gmailRouter = express.Router()

// OAuth client.
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  `${domainToUse}/auth/google/callback`
)

oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN })

// Routes
gmailRouter.get('/user', async (req, res) => {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${req.query.email}/profile`
    const { token } = await oAuth2Client.getAccessToken()
    const request = generateGoogleRequestForAxios(url, token)
    const response = await axios(request)
    res.json(response.data)
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})

gmailRouter.get('/watch', async (req, res) => {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${req.query.email}/watch`
    const { token } = await oAuth2Client.getAccessToken()
    const request = generateGmailWatchRequestForAxios(url, token)
    const response = await axios(request)
    res.json(response.data)
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})

module.exports = gmailRouter
