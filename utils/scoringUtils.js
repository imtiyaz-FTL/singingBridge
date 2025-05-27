const Match = require("../models/Tournament/Match");
const Player = require("../models/Tournament/PlayersTournament");


exports.calculateTournamentScores = async (tournament) => {
    for (const playerId of tournament.players) {
        const player = await Player.findById(playerId);
        if (!player) continue;
        console.log(player,"+++++999999999999999999999++++++")

        const matches = await Match.find({
            $or: [{ player1: player.user }, { player2: player.user }],
            result: { $ne: 'pending' },
        });
        console.log(matches,"+++++15++++++scoringUtils")

        let buchholzScore = 0;
        let sbScore = 0;

        for (const match of matches) {
            const isWinner = match.winner === player.user;
            const isLoser = match.loser === player.user;
            const isDraw = !isWinner && !isLoser;

            const opponentId = isWinner ? match.loser : match.winner;
            const opponent = await Player.findOne({ user: opponentId });
            
            if (opponent) {
                const scoreContribution = isDraw ? 0.5 : 1;

                // Buchholz Score Calculation
                buchholzScore += opponent.score;

                // Sonneborn-Berger Score Calculation
                if (isWinner) {
                    sbScore += opponent.score * scoreContribution;
                } else if (isDraw) {
                    sbScore += (opponent.score * 0.5); // Consider half score for draw in Sonneborn-Berger
                }
            }
        }

        // Update the player's tournament score
        player.buchholz = buchholzScore;
        player.sonnebornBerger = sbScore;
        await player.save();
    }
};
