const games = {}

const update = ({ message }) => {
  const { from, chat, text, entities } = message
  console.log(from, chat, text, entities)
}

module.exports = update
