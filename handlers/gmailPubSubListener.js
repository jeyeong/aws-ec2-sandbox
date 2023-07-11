const { PubSub } = require('@google-cloud/pubsub')
const { google } = require('googleapis')
const axios = require('axios')

const { generateGoogleRequestForAxios } = require('../utils/requestGenerators')
const { domainToUse } = require('../constants')

const subscriptionNameOrId =
  'projects/gmail-api-sandbox-391202/subscriptions/my-sub'

const oAuth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  `${domainToUse}/auth/google/callback`
)

oAuth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN })

// State.
let previousHistoryID = '1930550'
const messagesParsed = new Set()

// Pub/Sub.
const pubSubClient = new PubSub()

const getMessage = async (emailAddress, messageId) => {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${emailAddress}/messages/${messageId}`
    const { token } = await oAuth2Client.getAccessToken()
    const request = generateGoogleRequestForAxios(url, token)
    const response = await axios(request)

    const messageInPlaintextBase64 =
      response?.data?.payload?.parts?.[0]?.body?.data

    if (messageInPlaintextBase64) {
      const messageInPlaintextUTF8 = Buffer.from(
        messageInPlaintextBase64,
        'base64'
      ).toString('utf-8')

      console.log(`The message in the email is:\n${messageInPlaintextUTF8}`)
    }
  } catch (error) {
    console.error(error)
  }
}

const getHistory = async (emailAddress, historyId) => {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${emailAddress}/history?startHistoryId=${historyId}&labelId=${'INBOX'}`
    const { token } = await oAuth2Client.getAccessToken()
    const request = generateGoogleRequestForAxios(url, token)
    const response = await axios(request)

    const emails = response.data?.history || []

    for (const email of emails) {
      // Only read emails that were sent.
      if (email.messagesAdded) {
        const messageId = email.messagesAdded?.[0]?.message?.id
        if (messageId && !messagesParsed.has(messageId)) {
          messagesParsed.add(messageId)
          await getMessage(emailAddress, messageId)

          break
        }
      }
    }
  } catch (error) {
    console.error(error)
  }
}

const listenForEmails = () => {
  // References an existing subscription
  const subscription = pubSubClient.subscription(subscriptionNameOrId)

  // Create an event handler to handle messages
  const messageHandler = async (message) => {
    const { emailAddress, historyId } = JSON.parse(message.data.toString())

    if (emailAddress === 'sohjeyeong@gmail.com' && historyId) {
      console.log(`Message received. History ID is ${historyId}`)
      await getHistory(emailAddress, previousHistoryID)

      previousHistoryID = historyId
    }

    // "Ack" (acknowledge receipt of) the message
    message.ack()
  }

  // Listen for new messages until timeout is hit
  subscription.on('message', messageHandler)

  console.log(`Listening for Pub/sub: ${subscriptionNameOrId}`)
}

module.exports = { listenForEmails }
