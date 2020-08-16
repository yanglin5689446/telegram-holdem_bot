const nameResolver = ({ first_name, last_name }) =>
  first_name + (last_name ? ' ' + last_name : '')

const distributePrize = (winners, participants) => {
  // The winner only gets the pots fit in his bet,
  // the rest prize should return to owners.
  // If there has mulitple winners, 
  // then compute appropriate pots from less to more.

  winners = winners.slice();
  winners.sort((a, b) => a.bet - b.bet);
  while (winners.length > 0) {
    let currentBet = winners[0].bet;
    currentPots = 0;
    for (participant of participants) {
      if (participant.bet > 0) {
        currentPots += Math.min(participant.bet, currentBet);
        participant.bet = Math.max(0, participant.bet - currentBet);
      }
    }
    // TODO: Handle prize cannot divide equally
    let dividedPrize = Math.floor(currentPots / winners.length);
    let count = 0; // Count how many user did the same bet
    for (winner of winners) {
      winner.balance += dividedPrize;
      if (winner.bet == currentBet) ++count;
    }
    winners.splice(0, count);
  }

  // Return rest pots
  for (participant of participants) {
    if (participant.bet > 0) {
      participant.balance += participant.bet;
    }
  }
};

module.exports = {
  nameResolver,
  distributePrize
}
