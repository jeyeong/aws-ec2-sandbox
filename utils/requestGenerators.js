const generateGoogleRequestForAxios = (url, accessToken) => {
  return {
    method: 'get',
    url: url,
    headers: {
      Authorization: `Bearer ${accessToken} `,
      'Content-type': 'application/json',
    },
  }
}

const generateGmailWatchRequestForAxios = (url, accessToken) => {
  return {
    method: 'post',
    url: url,
    headers: {
      Authorization: `Bearer ${accessToken} `,
      'Content-type': 'application/json',
    },
    data: {
      labelIds: ['UNREAD'],
      topicName: 'projects/gmail-api-sandbox-391202/topics/my-topic',
      labelFilterBehavior: 'include',
    },
  }
}

module.exports = {
  generateGoogleRequestForAxios,
  generateGmailWatchRequestForAxios,
}
