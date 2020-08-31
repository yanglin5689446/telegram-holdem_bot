const COMMANDS = require('../app/commands.js')
const Game = require('../app/game.js')

class InfoMock {
  buffer = ''
  info = (text) => {
    this.buffer += text
  }
  clear = () => {
    this.buffer = ''
  }
}

describe('Game class', () => {
  let participants, headcount
  const initialBalance = 1000
  const destructor = jest.fn()
  const infoMock = new InfoMock()
  beforeEach(() => {
    infoMock.clear()
    participants = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ].map(({ id, name }) => ({
      id,
      name,
      balance: initialBalance,
      cards: [],
      fold: false,
      bet: 0,
      allIn: false,
    }))
    headcount = participants.length
  })

  describe('when starting a new round', () => {
    test('charge blinds correctly', () => {
      const game = new Game({ participants, destructor, info: infoMock.info, deleteInfo: () => {} })
      game.startRound()

      expect(game.starter).toBe(1)
      expect(game.participants[1].balance).toBe(initialBalance - game.sb)
      expect(game.participants[1].bet).toBe(game.sb)
      expect(game.participants[(1 + 1) % headcount].balance).toBe(
        initialBalance - game.bb
      )
      expect(game.participants[(1 + 1) % headcount].bet).toBe(game.bb)
    })
  })

  describe('when in betting round', () => {
    let game = null
    beforeEach(() => {
      game = new Game({ participants, destructor, info: infoMock.info, deleteInfo: () => {} })
      game.startRound()
    })
    test("users' actions works correctly", () => {
      // participants 1 is sb, can't check
      game.act(participants[1], COMMANDS.CHECK, {})
      expect(game.current).toBe(1)

      game.act(participants[1], COMMANDS.CALL, {})
      let next = (1 + 1) % headcount
      expect(game.current).toBe(next)

      game.act(participants[next], COMMANDS.RAISE, {})
      next = (next + 1) % headcount
      expect(game.current).toBe(next)

      game.act(participants[next], COMMANDS.RAISE, {})
      next = (next + 1) % headcount
      expect(game.current).toBe(next)

      game.act(participants[next], COMMANDS.CHECK, {})
      expect(game.current).toBe(next)

      game.act(participants[next], COMMANDS.CALL, {})
      next = (next + 1) % headcount
      expect(game.current).toBe(next)
    })
  })

  describe('when ending a round', () => {
    test('starts a new round correctly', () => {
      const game = new Game({ participants, destructor, info: infoMock.info, deleteInfo: () => {}})

      participants.forEach((participant) => {
        expect(participant.bet).toBe(0)
        expect(participant.fold).toBe(false)
        expect(participant.allIn).toBe(false)
        expect(participant.cards.length).toBe(0)
      })

      game.startRound()

      expect(game.starter).toBe(1)
      expect(game.current).toBe(1)
      expect(game.currentBet).toBe(game.bb)
      expect(game.deck.length).toBe(52 - 2 * headcount)
      expect(game.faceUpCards.length).toBe(0)

      game.endRound([participants[0].id])

      participants.forEach((participant) => {
        expect(participant.bet).toBe(0)
        expect(participant.fold).toBe(false)
        expect(participant.allIn).toBe(false)
        expect(participant.cards.length).toBe(0)
      })

      game.startRound()

      let next = (1 + 1) % headcount

      expect(game.starter).toBe(next)
      expect(game.current).toBe(next)
      expect(game.currentBet).toBe(game.bb)
      expect(game.deck.length).toBe(52 - 2 * headcount)
      expect(game.faceUpCards.length).toBe(0)
    })
  })

  describe('flop to end', () => {
    test('every one all in', () => {
      let game = new Game({ participants, destructor, info: infoMock.info , deleteInfo: () => {}})
      const mockEndRound = jest.fn()
      game.endRound = mockEndRound
      game.startRound()
      game.act(participants[1], COMMANDS.ALL_IN, {})
      game.act(participants[0], COMMANDS.ALL_IN, {})
      // Can't just check faceUp cards because round reset directly
      expect(mockEndRound.mock.calls.length).toBe(1)
    })
    test('every one all in except one', () => {
      participants[1].balance = 930
      participants[0].balance = 1070
      let game = new Game({ participants, destructor, info: infoMock.info , deleteInfo: () => {}})
      const mockEndRound = jest.fn()
      game.endRound = mockEndRound
      game.startRound()
      game.act(participants[1], COMMANDS.ALL_IN, {})
      game.act(participants[0], COMMANDS.CALL, {})
      // Can't just check faceUp cards because round reset directly
      expect(mockEndRound.mock.calls.length).toBe(1)
    })

  })
})
