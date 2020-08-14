const COMMANDS = require('./commands')
const { sendMessage } = require('./api')
const Room = require('./room')
const { nameResolver } = require('./utils')

const isCommand = ({ entities, text }) =>
  text && entities && entities.some(({ type }) => type === 'bot_command')

const checkGameCreated = (chat) => {
  if (!Room.get(chat.id)) {
    sendMessage({
      chat_id: chat.id,
      text: 'There is no game created yet, create one using /new',
    })
    return false
  }
  return true
}

const update = ({ message }) => {
  const { from: user, chat, text } = message

  let room = Room.get(chat.id)

  if (isCommand(message)) {
    const tokenized = text.split(' ')
    const command = tokenized[0].split('@')[0]
    switch (command) {
      case COMMANDS.NEW: {
        if (chat.type !== 'group' && chat.type !== 'supergroup') return
        if (!room) {
          room = new Room({ id: chat.id, holder: user })
          room.info('New game room created')
        } else {
          room.info('A game room has been created in this channel')
        }
        break
      }
      case COMMANDS.JOIN: {
        if (!checkGameCreated(chat)) break

        if (room.started) {
          room.info('The game has started')
          break
        }

        if (room.getParticipant(user)) {
          room.info('You have already joined the game')
        } else {
          room.addParticipant(user)
          room.info(`${nameResolver(user)} joined the game`)
        }
        break
      }
      case COMMANDS.START: {
        if (!checkGameCreated(chat)) break
        if (room.isHolder(user) && room.participants.length > 1) {
          room.info('Game start')
          room.initGame()
        }
        break
      }
      case COMMANDS.ABORT: {
        if (room && room.isHolder(user)) {
          room.info('OK aborted')
          room.destroy()
        }
        break
      }
      case COMMANDS.FOLD:
      case COMMANDS.CHECK:
      case COMMANDS.CALL:
      case COMMANDS.RAISE:
      case COMMANDS.ALL_IN:
        if (!checkGameCreated(chat)) break
        if (!room.started) {
          room.info("The game haven't started yet")
          break
        }
        room.game.act(user, command, { amount: tokenized[1] })
        break
      case COMMANDS.BALANCE: {
        if (!checkGameCreated(chat)) break

        const participant = room.getParticipant(user)
        if (participant) {
          room.info(`${nameResolver(user)}'s balance: ${participant.balance}`)
        } else {
          room.info(
            "Unable to check the balance. Either the game not started or you didn't join the game"
          )
        }
        break
      }
      case COMMANDS.POT: {
        if (!checkGameCreated(chat)) break
        if (!room.started) {
          room.info("The game haven't started yet")
          break
        }

        room.info(`Current Pot: ${room.game.pot}`)
        break
      }
    }
  }
}

module.exports = update
