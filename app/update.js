const COMMANDS = require('./commands')
const { sendMessage } = require('./api')
const {
  HAND_TYPE_NAMES,
  SUITS,
  NUMBERS,
  getBestPossible,
  compare,
} = require('./card')
const debug = require('./debug')

const rooms = {}
const nameResolver = ({ first_name, last_name }) =>
  first_name + (last_name ? ' ' + last_name : '')

class Game {
  constructor({ participants, destructor, info }) {
    this.bb = 20
    this.sb = 10
    this.starter = 0
    this.current = 0
    this.currentBet = 0
    this.deck = null
    this.faceUpCards = []
    this.participants = participants
    this.destructor = destructor
    this.info = info
  }
  gameOver() {
    this.broadcast('Game Over')
    this.destructor()
  }

  startRound() {
    this.info('New round started')
    const { bb, sb, participants } = this
    this.starter = (this.starter + 1) % participants.length
    const next = (this.starter + 1) % participants.length
    const third = (next + 1) % participants.length

    this.info(
      `SB is ${participants[this.starter].name}, BB is ${
        participants[next].name
      }`
    )

    if (
      participants[this.starter].balance < sb ||
      participants[next].balance < bb
    ) {
      this.gameOver()
    }
    participants[this.starter].balance -= sb
    participants[this.starter].bet += sb
    participants[next].balance -= bb
    participants[next].bet += bb

    this.createDeck()
    this.dealCard(2)
    this.currentBet = bb
    this.current = third
    this.broadcast(
      (participant) =>
        `Your card: ${participant.cards
          .map(({ suit, number }) => `${suit} ${number}`)
          .join(' ')}`
    )

    this.info(`It's ${this.participants[third].name}'s turn`)
  }

  endRound(winner) {
    winner.balance += winner.bet * this.participants.length
    const amount = winner.bet

    this.participants.forEach((participant) => {
      participant.balance += participant.bet - amount
      participant.bet = 0
      participant.cards = []
      participant.fold = false
      participant.allIn = false
    })
    this.faceUpCards = []
    this.info(`Winner of this round is ${winner.name}`)
    if (this.participants.some((participant) => participant.balance <= 0)) {
      this.gameOver()
    } else {
      this.info('New round will start in 5 seconds')
      setTimeout(this.startRound.bind(this), 5000)
    }
  }

  createDeck() {
    this.deck = SUITS.flatMap((suit) =>
      NUMBERS.map((number) => ({ suit, number }))
    )
    // shuffle
    new Array(100).fill(0).forEach(() => {
      let p = parseInt(Math.random() * 52),
        q = parseInt(Math.random() * 52)
      let t = this.deck[p]
      this.deck[p] = this.deck[q]
      this.deck[q] = t
    })
  }
  flop(n) {
    // burn
    this.deck.shift()
    this.faceUpCards = this.faceUpCards.concat(this.deck.splice(0, n))
  }
  dealCard(count) {
    for (let i = 0; i < count; i++) {
      this.participants.forEach((participant) =>
        participant.cards.push(this.deck.shift())
      )
    }
  }

  checkWinner() {
    const survivors = this.participants
      .filter((participant) => !participant.fold)
      .map((participant) => ({
        ...participant,
        hand: getBestPossible([...participant.cards, ...this.faceUpCards]),
      }))

    let message = 'Showdown: \n\n'
    message += survivors
      .map(
        (survivor) =>
          `${survivor.name}: ${survivor.hand.cards
            .map(({ suit, number }) => `${suit} ${number}`)
            .join(' ')}, ${HAND_TYPE_NAMES[survivor.hand.type]}`
      )
      .join('\n')

    this.info(message)

    survivors.sort((a, b) => compare(a.hand, b.hand))

    // @todo: handle end-in-a-draw situation
    const winner = this.participants.find((p) => p.id === survivors[0].id)

    this.endRound(winner)
  }

  bet(user, amount) {
    const available = user.balance - amount >= 0
    if (available) {
      user.balance -= amount
      user.bet += amount
    }
    return available
  }
  act(user, command, { amount = 1 }) {
    const { participants, sb } = this
    let ok = true

    debug(
      participants
        .map((p) =>
          Object.entries(p)
            .map(([k, v]) => `${k}: ${v}`)
            .join(',')
        )
        .join('\n')
    )

    if (user.id !== participants[this.current].id) return

    switch (command) {
      case COMMANDS.FOLD:
        participants[this.current].fold = true
        break
      case COMMANDS.CALL:
        ok = this.bet(
          participants[this.current],
          this.currentBet - participants[this.current].bet
        )
        break
      case COMMANDS.RAISE:
        const raiseAmount =
          this.currentBet - participants[this.current].bet + amount * sb
        ok = this.bet(participants[this.current], raiseAmount)
        if (ok) {
          this.currentBet = participants[this.current].bet
        }
        break
      case COMMANDS.CHECK:
        ok = participants[this.current].bet === this.currentBet
        break
      case COMMANDS.ALL_IN:
        this.bet(
          participants[this.current],
          this.participants[this.current].balance
        )
        participants[this.current].allIn = true
        break
    }
    // if the actions is valid
    if (ok) {
      // find next user
      do {
        this.current = (this.current + 1) % participants.length
      } while (
        (participants[this.current].fold || participants[this.current].allIn) &&
        this.current !== this.starter
      )

      // check bet round end
      if (
        this.current === this.starter &&
        (participants[this.current].bet === this.currentBet ||
          participants[this.current].allIn)
      ) {
        const pot = participants.reduce((acc, { bet }) => acc + bet, 0)
        this.info(`Betting round finish, current pot: ${pot}`)
        const survivors = participants.filter((p) => !p.fold)
        if (survivors.length === 1) {
          this.endRound(survivors[0])
          return
        }
        if (this.faceUpCards.length === 5) {
          this.checkWinner()
        }

        if (this.faceUpCards.length === 0) {
          this.flop(3)
        } else {
          this.flop(1)
        }
        this.info(
          `Current face-up cards: ${this.faceUpCards
            .map(({ suit, number }) => `${suit} ${number}`)
            .join(' ')}`
        )
      }
      setTimeout(
        () => this.info(`It's ${this.participants[this.current].name}'s turn`),
        500
      )
    } else {
      this.info('Invalid Action')
    }
  }

  broadcast(action) {
    if (typeof action === 'string') {
      this.participants.forEach((participant) =>
        sendMessage({ chat_id: participant.id, text: action })
      )
    } else if (typeof action === 'function') {
      this.participants.forEach((participant) =>
        sendMessage({ chat_id: participant.id, text: action(participant) })
      )
    }
  }
}

class Room {
  constructor({ id, holder }) {
    this.id = id
    this.holder = holder
    this.participants = [this.createParticipant(holder)]
    this.started = false
    this.game = null
    this.infoBuffer = ''
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
        this.infoTimeout = null
        this.infoBuffer = ''
      }, 100)
    }
  }
  initGame() {
    this.started = true
    this.game = new Game({
      participants: this.participants,
      destructor: this.destroyGame.bind(this),
      info: this.info.bind(this),
    })
    this.game.startRound()
  }
  destroyGame() {
    this.game = null
    delete rooms[this.id]
  }
}

const isHolder = (user, chat) =>
  rooms[chat.id] && user.id === rooms[chat.id].holder.id

const isCommand = ({ entities, text }) =>
  text && entities && entities.some(({ type }) => type === 'bot_command')

const checkGameCreated = (chat) => {
  if (!rooms[chat.id]) {
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

  if (isCommand(message)) {
    const tokenized = text.split(' ')
    const command = tokenized[0].split('@')[0]
    switch (command) {
      case COMMANDS.NEW: {
        if (chat.type !== 'group') return
        if (!rooms[chat.id]) {
          rooms[chat.id] = new Room({ id: chat.id, holder: user })
          rooms[chat.id].info('New game room created')
        } else {
          rooms[chat.id].info('A game room has been created in this channel')
        }
        break
      }
      case COMMANDS.JOIN: {
        if (!checkGameCreated(chat)) break

        if (rooms[chat.id].started) {
          rooms[chat.id].info('The game has started')
          break
        }

        if (rooms[chat.id].getParticipant(user)) {
          rooms[chat.id].info('You have already joined the game')
        } else {
          rooms[chat.id].addParticipant(user)
          rooms[chat.id].info(`${nameResolver(user)} joined the game`)
        }
        break
      }
      case COMMANDS.START: {
        if (!checkGameCreated(chat)) break
        if (isHolder(user, chat) && rooms[chat.id].participants.length > 1) {
          rooms[chat.id].info('Game start')
          rooms[chat.id].initGame()
        }
        break
      }
      case COMMANDS.ABORT: {
        if (isHolder(user, chat)) {
          rooms[chat.id].info('OK aborted')
          delete rooms[chat.id]
        }
        break
      }
      case COMMANDS.FOLD:
      case COMMANDS.CHECK:
      case COMMANDS.CALL:
      case COMMANDS.RAISE:
      case COMMANDS.ALL_IN:
        if (!checkGameCreated(chat)) break
        if (!rooms[chat.id].started) {
          rooms[chat.id].info("The game haven't started yet")
          break
        }
        rooms[chat.id].game.act(user, command, { amount: tokenized[1] })
        break
      case COMMANDS.BALANCE: {
        if (!checkGameCreated(chat)) break

        const participant = rooms[chat.id].getParticipant(user)
        if (participant) {
          rooms[chat.id].info(
            `${nameResolver(user)}'s balance: ${participant.balance}`
          )
        } else {
          rooms[chat.id].info(
            "Unable to check the balance. Either the game not started or you didn't join the game"
          )
        }
      }
    }
  }
}

module.exports = update
