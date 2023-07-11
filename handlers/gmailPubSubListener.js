const { PubSub } = require('@google-cloud/pubsub')
const axios = require('axios')

const { generateGoogleRequestForAxios } = require('../utils/requestGenerators')

const subscriptionNameOrId =
  'projects/gmail-api-sandbox-391202/subscriptions/my-sub'

// Pub/Sub.
const pubSubClient = new PubSub()

const getMessage = async (email, messageId) => {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${email}/messages/${messageId}`
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

const getHistory = async (email, historyId) => {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${email}/history?startHistoryId=${historyId}&labelId=${'INBOX'}`
    const { token } = await oAuth2Client.getAccessToken()
    const request = generateGoogleRequestForAxios(url, token)
    const response = await axios(request)

    const emails = response.data?.history
    const firstEmail = emails?.[0]
    const firstEmailId = firstEmail?.messages?.[0]?.id

    if (firstEmailId) {
      await getMessage(email, firstEmailId)
    } else {
      console.log('No email to read.')
    }
  } catch (error) {
    console.error(error)
  }
}

let previousHistoryID = '1927186'

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
