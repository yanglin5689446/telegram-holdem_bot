const Game = require('./game')
const { sendMessage, deleteMessage } = require('./api')
const { nameResolver } = require('./utils')

class Room {
  constructor({ id, holder }) {
    this.id = id
    this.holder = holder
    this.participants = [this.createParticipant(holder)]
    this.started = false
    this.game = null
    this.infoBuffer = ''
    this.lastMessageId = null
    rooms[id] = this
  }
  createParticipant(user) {
    return {
      id: user.id,
      name: nameResolver(user),
      balance: 1000,
      cards: [],
      fold: false,
      bet: 0,
      allIn: false,
    }
  }
  getParticipant(user) {
    return this.participants.find((participant) => participant.id === user.id)
  }
  addParticipant(user) {
    this.participants.push(this.createParticipant(user))
  }
  info(text) {
    this.infoBuffer += text + '\n'
    if (!this.infoTimeout) {
      this.infoTimeout = setTimeout(() => {
        sendMessage({ chat_id: this.id, text: this.infoBuffer })
          .then((response) => response.json())
          .then((json) => {
            this.lastMessageId = json.result.message_id
          })
          .catch(console.error)
        this.infoTimeout = null
        this.infoBuffer = ''
      }, 100)
    }
  }
  deleteInfo() {
    deleteMessage({ chat_id: this.id, message_id: this.lastMessageId }).catch(
      console.error
    )
  }
  initGame() {
    this.started = true
    this.game = new Game({
      participants: this.participants,
      destructor: this.destroy.bind(this),
      info: this.info.bind(this),
      deleteInfo: this.deleteInfo.bind(this),
    })
    this.game.startRound()
  }
  destroy() {
    this.game = null
    delete rooms[this.id]
  }

  isHolder = (user) => user.id === this.holder.id

  static get(id) {
    return rooms[id]
  }
}

const rooms = {}

module.exports = Room
