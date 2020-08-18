const COMMANDS = require('./commands')
const { sendMessage, deleteMessage } = require('./api')
const {
  HAND_TYPE_NAMES,
  SUITS,
  NUMBERS,
  getBestPossible,
  compare,
} = require('./card')
const debug = require('./debug')
const utils = require('./utils')

class Game {
  constructor({ participants, destructor, info, deleteInfo }) {
    this.bb = 20
    this.sb = 10
    this.starter = 0
    this.current = 0
    this.last = 0
    this.currentBet = 0
    this.deck = null
    this.faceUpCards = []
    this.participants = participants
    this.destructor = destructor
    this.info = info
    this.deleteInfo = deleteInfo
    this.lastBroadcastedMessages = []
  }

  get pot() {
    return this.participants.reduce((total, user) => total + user.bet, 0)
  }

  gameOver() {
    this.info('Game Over')
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
    this.last = third
    this.broadcast(
      (participant) =>
        `Your card: ${participant.cards
          .map(({ suit, number }) => `${suit} ${number}`)
          .join(' ')}`
    )

    this.info(`It's ${this.participants[third].name}'s turn`)
  }

  endRound(winnerIds) {
    let winners = this.participants.filter((p) => winnerIds.includes(p.id))
    utils.distributePrize(winners, this.participants)
    this.participants.forEach((participant) => {
      participant.bet = 0
      participant.cards = []
      participant.fold = false
      participant.allIn = false
    })
    this.faceUpCards = []
    let winnersName = winners.map((winner) => winner.name).join(', ')
    this.info(`Winners of this round is ${winnersName}`)
    if (this.participants.some((participant) => participant.balance <= 0)) {
      this.gameOver()
    } else {
      this.info('New round will start in 5 seconds')
      setTimeout(this.startRound.bind(this), 5000)
    }

    // delete previous card
    this.lastBroadcastedMessages.forEach((message) => deleteMessage(message))
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

    let winnerCards = survivors[0].hand.cards
    let winnerIds = []
    survivors.forEach((survivor) => {
      const isTie = survivor.hand.cards.every(
        (card, index) => card.number === winnerCards[index].number
      )
      if (isTie) winnerIds.push(survivor.id)
    })

    this.endRound(winnerIds)
  }

  bet(user, amount) {
    const available = user.balance - amount >= 0 && amount > 0
    if (available) {
      user.balance -= amount
      user.bet += amount
    }
    return available
  }
  act(user, command, { amount = 1 }) {
    this.deleteInfo()
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
        let user = participants[this.current]
        ok = this.bet(user, this.currentBet - participants[this.current].bet)
        user.allIn = user.balance === 0
        break
      case COMMANDS.RAISE:
        const raiseAmount =
          this.currentBet - participants[this.current].bet + amount * sb
        ok = this.bet(participants[this.current], raiseAmount)
        if (ok) {
          this.currentBet = participants[this.current].bet
          this.last = this.current
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
        if (participants[this.current].bet > this.currentBet) {
          this.currentBet = participants[this.current].bet
          this.last = this.current
        }
        participants[this.current].allIn = true
        break
    }
    let responseMessage
    // if the actions is valid
    if (ok) {
      // check if everybody folds cards
      const survivors = participants.filter((p) => !p.fold)
      if (survivors.length === 1) {
        this.endRound([survivors[0].id])
        return
      }

      // find next user
      const inactive = (user) => user.fold || user.allIn
      do {
        this.current = (this.current + 1) % participants.length
      } while (
        inactive(participants[this.current]) &&
        this.current !== this.last
      )

      // check bet round end
      if (this.current === this.last) {
        if (participants.every(inactive)) {
          while (this.faceUpCards.length !== 5) this.flop(1)
        }

        this.info(`Betting round finish, current pot: ${this.pot}`)
        if (this.faceUpCards.length === 5) {
          this.checkWinner()
          return
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
        this.current = this.starter
        while (inactive(participants[this.current]))
          this.current = (this.current + 1) % participants.length
        this.last = this.current
      }
      responseMessage = `It's ${this.participants[this.current].name}'s turn`
    } else {
      responseMessage = 'Invalid Action'
    }
    setTimeout(() => this.info(responseMessage), 100)
  }

  broadcast(action) {
    Promise.all(
      this.participants.map((participant) =>
        sendMessage({
          chat_id: participant.id,
          text: typeof action === 'string' ? action : action(participant),
        })
      )
    )
      .then((responses) =>
        Promise.all(responses.map((response) => response.json()))
      )
      .then((data) => {
        this.lastBroadcastedMessages = data.map(({ result }) => ({
          chat_id: result.chat.id,
          message_id: result.message_id,
        }))
      })
  }
}

module.exports = Game
