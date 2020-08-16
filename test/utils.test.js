const { distributePrize } = require('../app/utils.js');

describe('distributePrize', () => {
    describe('only one winner', () => {
        test('winner bet the most', () => {
            participants = [{
                id: '0',
                bet: 100,
                balance: 900
            }, {
                id: '1',
                bet: 30,
                balance: 970
            }, {
                id: '2',
                bet: 70,
                balance: 930
            }]
            let winners = [participants[0]];
            distributePrize(winners, participants);
            // Cannot lose the ordering of participants
            expect(participants[0].id).toBe('0');  // winner
            expect(participants[0].balance).toBe(1100);
            expect(participants[1].id).toBe('1');
            expect(participants[1].balance).toBe(970);
            expect(participants[2].id).toBe('2');
            expect(participants[2].balance).toBe(930);
        });
        test('winner bet the least', () => {
            participants = [{
                id: '0',
                bet: 100,
                balance: 900
            }, {
                id: '1',
                bet: 30,
                balance: 970
            }, {
                id: '2',
                bet: 70,
                balance: 930
            }]
            let winners = [participants[1]];
            distributePrize(winners, participants);
            // Cannot lose the ordering of participants
            expect(participants[0].id).toBe('0');  
            expect(participants[0].balance).toBe(970);
            expect(participants[1].id).toBe('1'); // winner
            expect(participants[1].balance).toBe(1060);
            expect(participants[2].id).toBe('2');
            expect(participants[2].balance).toBe(970);
        });
        test('winner bet less', () => {
            participants = [{
                id: '0',
                bet: 100,
                balance: 900
            }, {
                id: '1',
                bet: 30,
                balance: 970
            }, {
                id: '2',
                bet: 70,
                balance: 930
            }]
            let winners = [participants[2]];
            distributePrize(winners, participants);
            // Cannot lose the ordering of participants
            expect(participants[0].id).toBe('0');  
            expect(participants[0].balance).toBe(930);
            expect(participants[1].id).toBe('1'); 
            expect(participants[1].balance).toBe(970);
            expect(participants[2].id).toBe('2'); // winner
            expect(participants[2].balance).toBe(1100);
        });
    });
    describe('multiple winners', () => {
        // TODO: add tests
    });
});