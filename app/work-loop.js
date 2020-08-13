const { getUpdates } = require('./api')

let offset = 0
let lastRequest = null

const workLoop = (callback) => () => {
  if (lastRequest && !lastRequest.done) return
  lastRequest = getUpdates({ offset })
    .then((response) => response.json())
    .then((json) => {
      const { ok, result } = json
      if (!ok) return
      result.forEach(callback)
      if (result.length) {
        console.log(result)
        const { update_id } = result[result.length - 1]
        offset = update_id + 1
      }
      lastRequest.done = true
    })
  return lastRequest
}

module.exports = workLoop
