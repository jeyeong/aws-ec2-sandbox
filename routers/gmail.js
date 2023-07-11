const express = require('express')
const { google } = require('googleapis')
const axios = require('axios')

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

// Request helpers.
const generateConfig = (url, accessToken) => {
  return {
    method: 'get',
    url: url,
    headers: {
      Authorization: `Bearer ${accessToken} `,
      'Content-type': 'application/json',
    },
  }
}

const generateWatchConfig = (url, accessToken) => {
  return {
    method: 'post',
    url: url,
    headers: {
      Authorization: `Bearer ${accessToken} `,
      'Content-type': 'application/json',
    },
    data: {
      labelIds: ['INBOX'],
      topicName: 'projects/gmail-api-sandbox-391202/topics/my-topic',
      labelFilterBehavior: 'include',
    },
  }
}

// Routes
gmailRouter.get('/user', async (req, res) => {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${req.query.email}/profile`
    const { token } = await oAuth2Client.getAccessToken()
    const config = generateConfig(url, token)
    const response = await axios(config)
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
    const config = generateWatchConfig(url, token)
    const response = await axios(config)
    res.json(response.data)
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})

module.exports = gmailRouter
