require('dotenv').config()
const fetch = require('node-fetch')
const API_URL = 'https://api.telegram.org/bot' + process.env.TOKEN

const GET_UPDATES_API = API_URL + '/getUpdates'

let offset = 0

const getUpdates = (callback) => () => {
  const params = new URLSearchParams()
  params.set('offset', offset)
  return fetch(`${GET_UPDATES_API}?${params.toString()}`)
    .then((response) => response.json())
    .then((json) => {
      const { ok, result } = json
      if (!ok) return
      result.forEach(callback)
      if (result.length) {
        const { update_id } = result[result.length - 1]
        offset = update_id + 1
      }
    })
}

module.exports = getUpdates
