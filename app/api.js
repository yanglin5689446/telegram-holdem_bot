const fetch = require('node-fetch')

const API_URL = 'https://api.telegram.org/bot' + process.env.TOKEN

const makeAPI = (endpoint) => (params) => {
  const _params = new URLSearchParams()
  Object.entries(params)
    .filter((entry) => entry[1] != null)
    .forEach(([key, value]) => _params.set(key, value))
  return fetch(`${API_URL}/${endpoint}?${_params.toString()}`)
}

const sendMessage = makeAPI('sendMessage')
const deleteMessage = makeAPI('deleteMessage')
const getUpdates = makeAPI('getUpdates')

module.exports = {
  API_URL,
  sendMessage,
  deleteMessage,
  getUpdates,
}
