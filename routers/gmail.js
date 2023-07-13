const express = require('express')
const { google } = require('googleapis')
const axios = require('axios')

const {
  generateGoogleRequestForAxios,
  generateGmailWatchRequestForAxios,
} = require('../utils/requestGenerators')
const { getUserRefreshToken } = require('../handlers/firestoreFunctions')
const { domainToUse } = require('../constants')

// Router.
const gmailRouter = express.Router()

// OAuth client.
const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  `${domainToUse}/auth/google/callback`
)

const _setOAuth2ClientRefreshToken = (refreshToken) => {
  oAuth2Client.setCredentials({ refresh_token: refreshToken })
}

// Routes
gmailRouter.get('/user', async (req, res) => {
  if (!req.query.email) {
    res.send('"email" query parameter is required.')
    return
  }

  const email = req.query.email

  try {
    const refreshToken = await getUserRefreshToken(email)
    if (!refreshToken) {
      res.send('User refresh token is not in database.')
      return
    }

    _setOAuth2ClientRefreshToken(refreshToken)

    const url = `https://gmail.googleapis.com/gmail/v1/users/${email}/profile`
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
  if (!req.query.email) {
    res.send('"email" query parameter is required.')
    return
  }

  const email = req.query.email

  try {
    const refreshToken = await getUserRefreshToken(email)
    if (!refreshToken) {
      res.send('User refresh token is not in database.')
      return
    }

    _setOAuth2ClientRefreshToken(refreshToken)

    const url = `https://gmail.googleapis.com/gmail/v1/users/${email}/watch`
    const { token } = await oAuth2Client.getAccessToken()
    const request = generateGmailWatchRequestForAxios(url, token)
    const response = await axios({
      ...request,
      data: {
        labelIds: ['UNREAD'],
        topicName: 'projects/gmail-api-sandbox-391202/topics/my-topic',
        labelFilterBehavior: 'include',
      },
    })
    res.json(response.data)
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})

gmailRouter.get('/stop-watching', async (req, res) => {
  if (!req.query.email) {
    res.send('"email" query parameter is required.')
    return
  }

  const email = req.query.email

  try {
    const refreshToken = await getUserRefreshToken(email)
    if (!refreshToken) {
      res.send('User refresh token is not in database.')
      return
    }

    _setOAuth2ClientRefreshToken(refreshToken)

    const url = `https://gmail.googleapis.com/gmail/v1/users/${email}/stop`
    const { token } = await oAuth2Client.getAccessToken()
    const request = generateGmailWatchRequestForAxios(url, token)
    const response = await axios(request)

    if (response.data === '') {
      res.send('Stop watching successful.')
    } else {
      res.send(response.json)
    }
  } catch (error) {
    console.log(error)
    res.send(error)
  }
})

module.exports = gmailRouter
