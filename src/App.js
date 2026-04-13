import React, { useEffect, useMemo, useState } from 'react';
import logo from './logo.jpg';

const STORAGE_KEY = 'dink-side-organizer-state';
const LEGACY_PLAYER_NAMES = [
  'Jordan',
  'Kyana',
  'Kyara',
  'Chauncy',
  'Kyan',
  'Saf',
  'Kyde',
  'Cyra',
];

function App() {
  const sampleOpenPlayers = [
    'Player 1',
    'Player 2',
    'Player 3',
    'Player 4',
    'Player 5',
    'Player 6',
    'Player 7',
    'Player 8',
  ];

  const sampleTournamentPlayers = [
    'Player 1',
    'Player 2',
    'Player 3',
    'Player 4',
    'Player 5',
    'Player 6',
    'Player 7',
    'Player 8',
  ];

  const defaultOpenPlay = {
    courts: 2,
    playerInput: '',
    players: sampleOpenPlayers.map((name, index) => ({
      id: `open-player-${index + 1}`,
      name,
      playCount: 0,
      waitCount: 0,
      lastRoundPlayed: 0,
    })),
    currentRound: 0,
    currentMatches: [],
    waitingPlayers: [],
    rounds: [],
    results: [],
    error: '',
    partnerStats: {},
    matchupStats: {},
  };

  const defaultTournament = {
    playerInput: '',
    players: sampleTournamentPlayers.map((name, index) => ({
      id: `tournament-player-${index + 1}`,
      name,
    })),
    teams: [],
    roundRobinRounds: [],
    roundRobinIndex: 0,
    currentMatches: [],
    currentLabel: '',
    stage: 'setup',
    error: '',
    history: [],
    winnerSeeds: [],
    loserSeeds: [],
    winnerChampion: '',
    loserChampion: '',
    champion: '',
    championshipMatch: null,
    bracketRoundNumber: 1,
    loserBracketRoundNumber: 1,
  };

  const defaultScoreboard = {
    teamAName: 'Team A',
    teamBName: 'Team B',
    teamAScore: 0,
    teamBScore: 0,
    servingTeam: 'A',
    serverNumber: 1,
    winner: '',
    matchStatus: 'Ready',
    source: null,
    returnPhase: 'menu',
    savedMatches: [],
    historyOpen: false,
    undoStack: [],
    showResetConfirm: false,
  };

  const [phase, setPhase] = useState('menu');
  const [openPlay, setOpenPlay] = useState(defaultOpenPlay);
  const [tournament, setTournament] = useState(defaultTournament);
  const [scoreboard, setScoreboard] = useState(defaultScoreboard);
  const [historyItems, setHistoryItems] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [tournamentWarning, setTournamentWarning] = useState('');

  function hasLegacySeedNames(players) {
    if (!Array.isArray(players) || players.length !== LEGACY_PLAYER_NAMES.length) {
      return false;
    }

    return players.every(
      (player, index) => player?.name === LEGACY_PLAYER_NAMES[index]
    );
  }

  function sanitizeOpenPlayState(savedOpenPlay) {
    if (!savedOpenPlay) {
      return defaultOpenPlay;
    }

    if (!hasLegacySeedNames(savedOpenPlay.players)) {
      return savedOpenPlay;
    }

    return {
      ...savedOpenPlay,
      playerInput: '',
      players: sampleOpenPlayers.map((name, index) => ({
        id: savedOpenPlay.players[index]?.id || `open-player-${index + 1}`,
        name,
        playCount: savedOpenPlay.players[index]?.playCount || 0,
        waitCount: savedOpenPlay.players[index]?.waitCount || 0,
        lastRoundPlayed: savedOpenPlay.players[index]?.lastRoundPlayed || 0,
      })),
    };
  }

  function sanitizeTournamentState(savedTournament) {
    if (!savedTournament) {
      return defaultTournament;
    }

    if (!hasLegacySeedNames(savedTournament.players)) {
      return savedTournament;
    }

    return {
      ...savedTournament,
      playerInput: '',
      players: sampleTournamentPlayers.map((name, index) => ({
        id:
          savedTournament.players[index]?.id || `tournament-player-${index + 1}`,
        name,
      })),
    };
  }

  useEffect(() => {
    const savedState = localStorage.getItem(STORAGE_KEY);

    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setPhase(parsed.phase || 'menu');
        setOpenPlay(sanitizeOpenPlayState(parsed.openPlay));
        setTournament(sanitizeTournamentState(parsed.tournament));
        setScoreboard(parsed.scoreboard || defaultScoreboard);
        setHistoryItems(parsed.historyItems || []);
      } catch (error) {
        console.log('Could not load saved app state.');
      }
    }

    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        phase,
        openPlay,
        tournament,
        scoreboard,
        historyItems,
      })
    );
  }, [hasLoaded, phase, openPlay, tournament, scoreboard, historyItems]);

  function resetWholeApp() {
    setPhase('menu');
    setOpenPlay(defaultOpenPlay);
    setTournament(defaultTournament);
    setScoreboard(defaultScoreboard);
    setHistoryItems([]);
    setTournamentWarning('');
    localStorage.removeItem(STORAGE_KEY);
  }

  function createId(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
  }

  function shuffleArray(array) {
    const copied = [...array];

    for (let i = copied.length - 1; i > 0; i -= 1) {
      const randomIndex = Math.floor(Math.random() * (i + 1));
      const temp = copied[i];
      copied[i] = copied[randomIndex];
      copied[randomIndex] = temp;
    }

    return copied;
  }

  function sortNames(nameA, nameB) {
    return [nameA, nameB].sort().join(' + ');
  }

  function addHistoryItem(type, title, subtitle) {
    setHistoryItems((previous) => [
      {
        id: createId('history'),
        type,
        title,
        subtitle,
        createdAt: new Date().toLocaleString(),
      },
      ...previous,
    ]);
  }

  function getOpenPlayPartnerPenalty(nameA, nameB) {
    const key = sortNames(nameA, nameB);
    return openPlay.partnerStats[key] || 0;
  }

  function getOpenPlayMatchupPenalty(teamA, teamB) {
    const key = sortNames(teamA.displayName, teamB.displayName);
    return openPlay.matchupStats[key] || 0;
  }

  function updateOpenPlayPlayerInput(value) {
    setOpenPlay((previous) => ({
      ...previous,
      playerInput: value,
    }));
  }

  function updateTournamentPlayerInput(value) {
    setTournament((previous) => ({
      ...previous,
      playerInput: value,
    }));
  }

  function addOpenPlayPlayer() {
    const trimmedName = openPlay.playerInput.trim();

    if (!trimmedName) {
      return;
    }

    setOpenPlay((previous) => ({
      ...previous,
      playerInput: '',
      players: [
        ...previous.players,
        {
          id: createId('open-player'),
          name: trimmedName,
          playCount: 0,
          waitCount: 0,
          lastRoundPlayed: 0,
        },
      ],
      error: '',
    }));
  }

  function removeOpenPlayPlayer(playerId) {
    setOpenPlay((previous) => ({
      ...previous,
      players: previous.players.filter((player) => player.id !== playerId),
    }));
  }

  function addTournamentPlayer() {
    const trimmedName = tournament.playerInput.trim();

    if (!trimmedName) {
      return;
    }

    setTournament((previous) => ({
      ...previous,
      playerInput: '',
      players: [
        ...previous.players,
        {
          id: createId('tournament-player'),
          name: trimmedName,
        },
      ],
      error: '',
    }));
  }

  function removeTournamentPlayer(playerId) {
    setTournament((previous) => ({
      ...previous,
      players: previous.players.filter((player) => player.id !== playerId),
      teams: previous.teams.filter(
        (team) => !team.playerIds.includes(playerId)
      ),
    }));
  }

  function adjustOpenPlayCourts(change) {
    setOpenPlay((previous) => ({
      ...previous,
      courts: Math.max(1, previous.courts + change),
    }));
  }

  function buildOpenPlayTeams(activePlayers) {
    const remainingPlayers = [...activePlayers];
    const createdTeams = [];

    while (remainingPlayers.length >= 2) {
      const firstPlayer = remainingPlayers.shift();
      let bestPartnerIndex = 0;
      let bestPartnerScore = Infinity;

      for (let i = 0; i < remainingPlayers.length; i += 1) {
        const partnerPlayer = remainingPlayers[i];
        const partnerPenalty = getOpenPlayPartnerPenalty(
          firstPlayer.name,
          partnerPlayer.name
        );
        const restBalance = Math.abs(firstPlayer.playCount - partnerPlayer.playCount);
        const score = partnerPenalty * 20 + restBalance;

        if (score < bestPartnerScore) {
          bestPartnerScore = score;
          bestPartnerIndex = i;
        }
      }

      const secondPlayer = remainingPlayers.splice(bestPartnerIndex, 1)[0];
      createdTeams.push({
        id: createId('open-team'),
        players: [firstPlayer.name, secondPlayer.name],
        displayName: `${firstPlayer.name} & ${secondPlayer.name}`,
      });
    }

    return createdTeams;
  }

  function buildOpenPlayMatches(teams, courts, roundNumber) {
    const remainingTeams = [...teams];
    const createdMatches = [];

    while (remainingTeams.length >= 2 && createdMatches.length < courts) {
      const firstTeam = remainingTeams.shift();
      let bestOpponentIndex = 0;
      let bestOpponentScore = Infinity;

      for (let i = 0; i < remainingTeams.length; i += 1) {
        const secondTeam = remainingTeams[i];
        const matchupPenalty = getOpenPlayMatchupPenalty(firstTeam, secondTeam);

        if (matchupPenalty < bestOpponentScore) {
          bestOpponentScore = matchupPenalty;
          bestOpponentIndex = i;
        }
      }

      const secondTeam = remainingTeams.splice(bestOpponentIndex, 1)[0];
      createdMatches.push({
        id: createId('open-match'),
        round: roundNumber,
        court: createdMatches.length + 1,
        teamA: firstTeam.displayName,
        teamB: secondTeam.displayName,
        winner: '',
        played: false,
      });
    }

    return createdMatches;
  }

  function getTeamPlayerNames(teamName) {
    return teamName.split(' & ').map((name) => name.trim());
  }

  function getBusyOpenPlayPlayers(matches, excludedMatchId) {
    return matches
      .filter((match) => !match.played && match.id !== excludedMatchId)
      .flatMap((match) => [
        ...getTeamPlayerNames(match.teamA),
        ...getTeamPlayerNames(match.teamB),
      ]);
  }

  function updateOpenPlayRoundTimeline(roundList, updatedMatch) {
    const roundExists = roundList.some((round) => round.round === updatedMatch.round);

    if (!roundExists) {
      return [
        {
          round: updatedMatch.round,
          matches: [updatedMatch],
          waitingPlayers: [],
        },
        ...roundList,
      ];
    }

    return roundList.map((round) => {
      if (round.round !== updatedMatch.round) {
        return round;
      }

      const alreadyTracked = round.matches.some((match) => match.id === updatedMatch.id);

      if (alreadyTracked) {
        return {
          ...round,
          matches: round.matches.map((match) =>
            match.id === updatedMatch.id ? updatedMatch : match
          ),
        };
      }

      return {
        ...round,
        matches: [...round.matches, updatedMatch],
      };
    });
  }

  function getOpenPlayWaitingNames(matches) {
    const activePlayerNames = new Set(
      matches
        .filter((match) => !match.played)
        .flatMap((match) => [
          ...getTeamPlayerNames(match.teamA),
          ...getTeamPlayerNames(match.teamB),
        ])
    );

    return openPlay.players
      .filter((player) => !activePlayerNames.has(player.name))
      .map((player) => player.name);
  }

  function createRotatedCourtMatch(previousMatch, roundNumber, courtNumber) {
    const teamAPlayers = getTeamPlayerNames(previousMatch.teamA);
    const teamBPlayers = getTeamPlayerNames(previousMatch.teamB);

    const firstOption = {
      teamA: `${teamAPlayers[0]} & ${teamBPlayers[0]}`,
      teamB: `${teamAPlayers[1]} & ${teamBPlayers[1]}`,
    };

    if (
      sortNames(firstOption.teamA, firstOption.teamB) !==
      sortNames(previousMatch.teamA, previousMatch.teamB)
    ) {
      return {
        id: createId('open-match'),
        round: roundNumber,
        court: courtNumber,
        teamA: firstOption.teamA,
        teamB: firstOption.teamB,
        winner: '',
        played: false,
      };
    }

    return {
      id: createId('open-match'),
      round: roundNumber,
      court: courtNumber,
      teamA: `${teamAPlayers[0]} & ${teamBPlayers[1]}`,
      teamB: `${teamAPlayers[1]} & ${teamBPlayers[0]}`,
      winner: '',
      played: false,
    };
  }

  function createRollingOpenPlayMatch(courtNumber, excludedMatchId, previousMatch) {
    const busyPlayerNames = new Set(
      getBusyOpenPlayPlayers(openPlay.currentMatches, excludedMatchId)
    );

    const availablePlayers = shuffleArray(
      openPlay.players.filter((player) => !busyPlayerNames.has(player.name))
    ).sort((a, b) => {
      if (a.playCount !== b.playCount) {
        return a.playCount - b.playCount;
      }

      if (b.waitCount !== a.waitCount) {
        return b.waitCount - a.waitCount;
      }

      return a.lastRoundPlayed - b.lastRoundPlayed;
    });

    if (availablePlayers.length < 4) {
      return null;
    }

    const chosenPlayers = availablePlayers.slice(0, 4);
    const waitingPlayers = availablePlayers.slice(4);
    const nextRoundNumber = openPlay.currentRound + 1;
    const previousPlayers = [
      ...getTeamPlayerNames(previousMatch.teamA),
      ...getTeamPlayerNames(previousMatch.teamB),
    ].sort();
    const chosenPlayerNames = chosenPlayers.map((player) => player.name).sort();
    const usingSameFourPlayers =
      chosenPlayers.length === 4 &&
      previousPlayers.length === 4 &&
      previousPlayers.every((name, index) => name === chosenPlayerNames[index]);
    let createdMatch;

    if (usingSameFourPlayers) {
      createdMatch = createRotatedCourtMatch(previousMatch, nextRoundNumber, courtNumber);
    } else {
      const createdTeams = buildOpenPlayTeams(chosenPlayers);
      createdMatch = buildOpenPlayMatches(createdTeams, 1, nextRoundNumber)[0];
    }

    if (!createdMatch) {
      return null;
    }

    return {
      match: {
        ...createdMatch,
        court: courtNumber,
      },
      chosenPlayers,
      waitingPlayers,
      nextRoundNumber,
    };
  }

  function generateOpenPlayRound() {
    if (
      openPlay.currentMatches.length > 0 &&
      openPlay.currentMatches.some((match) => !match.played)
    ) {
      setOpenPlay((previous) => ({
        ...previous,
        error: 'Record winners for all courts before generating the next round.',
      }));
      return;
    }

    if (openPlay.players.length < 4) {
      setOpenPlay((previous) => ({
        ...previous,
        error: 'Add at least 4 players to create open play matches.',
      }));
      return;
    }

    const maxPlayablePlayers = Math.min(
      openPlay.courts * 4,
      openPlay.players.length - (openPlay.players.length % 4)
    );

    if (maxPlayablePlayers < 4) {
      setOpenPlay((previous) => ({
        ...previous,
        error: 'You need enough players to fill at least one doubles court.',
      }));
      return;
    }

    const sortedPlayers = shuffleArray([...openPlay.players]).sort((a, b) => {
      if (a.playCount !== b.playCount) {
        return a.playCount - b.playCount;
      }

      if (b.waitCount !== a.waitCount) {
        return b.waitCount - a.waitCount;
      }

      return a.lastRoundPlayed - b.lastRoundPlayed;
    });

    const activePlayers = sortedPlayers.slice(0, maxPlayablePlayers);
    const waitingPlayers = sortedPlayers.slice(maxPlayablePlayers);
    const nextRoundNumber = openPlay.currentRound + 1;
    const createdTeams = buildOpenPlayTeams(activePlayers);
    const createdMatches = buildOpenPlayMatches(
      createdTeams,
      openPlay.courts,
      nextRoundNumber
    );

    const updatedPlayers = openPlay.players.map((player) => {
      const isActive = activePlayers.some((activePlayer) => activePlayer.id === player.id);
      const isWaiting = waitingPlayers.some((waitingPlayer) => waitingPlayer.id === player.id);

      if (isActive) {
        return {
          ...player,
          playCount: player.playCount + 1,
          lastRoundPlayed: nextRoundNumber,
        };
      }

      if (isWaiting) {
        return {
          ...player,
          waitCount: player.waitCount + 1,
        };
      }

      return player;
    });

    const updatedPartnerStats = { ...openPlay.partnerStats };
    const updatedMatchupStats = { ...openPlay.matchupStats };

    createdTeams.forEach((team) => {
      const pairKey = sortNames(team.players[0], team.players[1]);
      updatedPartnerStats[pairKey] = (updatedPartnerStats[pairKey] || 0) + 1;
    });

    createdMatches.forEach((match) => {
      const matchupKey = sortNames(match.teamA, match.teamB);
      updatedMatchupStats[matchupKey] = (updatedMatchupStats[matchupKey] || 0) + 1;
    });

    setOpenPlay((previous) => ({
      ...previous,
      players: updatedPlayers,
      currentRound: nextRoundNumber,
      currentMatches: createdMatches,
      waitingPlayers: waitingPlayers.map((player) => player.name),
      rounds: [
        {
          round: nextRoundNumber,
          matches: createdMatches,
          waitingPlayers: waitingPlayers.map((player) => player.name),
        },
        ...previous.rounds,
      ],
      error: '',
      partnerStats: updatedPartnerStats,
      matchupStats: updatedMatchupStats,
    }));

    addHistoryItem(
      'Open Play',
      `Open Play Round ${nextRoundNumber} generated`,
      `${createdMatches.length} courts active${waitingPlayers.length > 0 ? `, ${waitingPlayers.length} waiting` : ''}`
    );
  }

  function recordOpenPlayWinner(matchId, winnerName) {
    const selectedMatch = openPlay.currentMatches.find((match) => match.id === matchId);

    if (!selectedMatch || selectedMatch.played) {
      return;
    }

    let updatedCurrentMatches = openPlay.currentMatches.map((match) =>
      match.id === matchId
        ? {
            ...match,
            winner: winnerName,
            played: true,
          }
        : match
    );

    let updatedRounds = openPlay.rounds.map((round) => ({
      ...round,
      matches: round.matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              winner: winnerName,
              played: true,
            }
          : match
      ),
    }));

    const loserName =
      selectedMatch.teamA === winnerName ? selectedMatch.teamB : selectedMatch.teamA;
    const resultEntry = {
      id: createId('open-result'),
      type: 'openPlay',
      round: selectedMatch.round,
      court: selectedMatch.court,
      teamA: selectedMatch.teamA,
      teamB: selectedMatch.teamB,
      winner: winnerName,
      createdAt: new Date().toLocaleString(),
    };

    const rollingMatchData = createRollingOpenPlayMatch(
      selectedMatch.court,
      matchId,
      selectedMatch
    );
    let updatedPlayers = openPlay.players;
    let updatedCurrentRound = openPlay.currentRound;

    if (rollingMatchData) {
      updatedCurrentMatches = updatedCurrentMatches.map((match) =>
        match.id === matchId ? rollingMatchData.match : match
      );

      updatedRounds = updateOpenPlayRoundTimeline(updatedRounds, rollingMatchData.match);
      updatedCurrentRound = rollingMatchData.nextRoundNumber;

      updatedPlayers = openPlay.players.map((player) => {
        const isChosen = rollingMatchData.chosenPlayers.some(
          (chosenPlayer) => chosenPlayer.id === player.id
        );
        const isWaiting = rollingMatchData.waitingPlayers.some(
          (waitingPlayer) => waitingPlayer.id === player.id
        );

        if (isChosen) {
          return {
            ...player,
            playCount: player.playCount + 1,
            lastRoundPlayed: rollingMatchData.nextRoundNumber,
          };
        }

        if (isWaiting) {
          return {
            ...player,
            waitCount: player.waitCount + 1,
          };
        }

        return player;
      });
    }

    const nextWaitingPlayers = getOpenPlayWaitingNames(updatedCurrentMatches);

    setOpenPlay((previous) => ({
      ...previous,
      currentMatches: updatedCurrentMatches,
      rounds: updatedRounds,
      results: [resultEntry, ...previous.results],
      players: updatedPlayers,
      currentRound: updatedCurrentRound,
      waitingPlayers: nextWaitingPlayers,
    }));

    addHistoryItem(
      'Open Play',
      `Court ${selectedMatch.court} winner`,
      `${winnerName} defeated ${loserName} in Round ${selectedMatch.round}`
    );

    if (rollingMatchData) {
      addHistoryItem(
        'Open Play',
        `Court ${selectedMatch.court} next game ready`,
        `${rollingMatchData.match.teamA} vs ${rollingMatchData.match.teamB} in Round ${rollingMatchData.match.round}`
      );
    }
  }

  function createTournamentTeams(autoShuffle = false) {
    if (tournament.players.length < 4) {
      setTournament((previous) => ({
        ...previous,
        error: 'Add at least 4 players before creating teams.',
      }));
      return;
    }

    if (tournament.players.length % 2 !== 0) {
      setTournament((previous) => ({
        ...previous,
        error: 'Tournament mode needs an even number of players.',
      }));
      return;
    }

    const sourcePlayers = autoShuffle
      ? shuffleArray([...tournament.players])
      : [...tournament.players];
    const createdTeams = [];

    for (let i = 0; i < sourcePlayers.length; i += 2) {
      createdTeams.push({
        id: createId('team'),
        playerIds: [sourcePlayers[i].id, sourcePlayers[i + 1].id],
        players: [sourcePlayers[i].name, sourcePlayers[i + 1].name],
        displayName: `${sourcePlayers[i].name} & ${sourcePlayers[i + 1].name}`,
        originalOrder: i / 2,
      });
    }

    setTournament((previous) => ({
      ...previous,
      teams: createdTeams,
      stage: 'setup',
      error: '',
    }));
  }

  function generateRoundRobinRounds(teamList) {
    const teamsForSchedule = [...teamList];
    const rounds = [];
    let matchCounter = 1;

    if (teamsForSchedule.length % 2 !== 0) {
      teamsForSchedule.push({
        id: 'bye',
        displayName: 'BYE',
      });
    }

    const rotating = [...teamsForSchedule];

    for (let roundIndex = 0; roundIndex < rotating.length - 1; roundIndex += 1) {
      const matches = [];

      for (let i = 0; i < rotating.length / 2; i += 1) {
        const teamA = rotating[i];
        const teamB = rotating[rotating.length - 1 - i];

        if (teamA.displayName !== 'BYE' && teamB.displayName !== 'BYE') {
          matches.push({
            id: `rr-${matchCounter}`,
            teamA: teamA.displayName,
            teamB: teamB.displayName,
            winner: '',
          });
          matchCounter += 1;
        }
      }

      rounds.push({
        label: `Round ${roundIndex + 1}`,
        matches,
      });

      const fixedTeam = rotating[0];
      const movedTeam = rotating.pop();
      rotating.splice(1, 0, movedTeam);
      rotating[0] = fixedTeam;
    }

    return rounds;
  }

  function startTournament() {
    let activeTeams = tournament.teams;

    if (activeTeams.length === 0) {
      const sourcePlayers = [...tournament.players];

      if (sourcePlayers.length < 4 || sourcePlayers.length % 2 !== 0) {
        setTournament((previous) => ({
          ...previous,
          error: 'Create valid doubles teams first.',
        }));
        return;
      }

      const fallbackTeams = [];

      for (let i = 0; i < sourcePlayers.length; i += 2) {
        fallbackTeams.push({
          id: createId('team'),
          playerIds: [sourcePlayers[i].id, sourcePlayers[i + 1].id],
          players: [sourcePlayers[i].name, sourcePlayers[i + 1].name],
          displayName: `${sourcePlayers[i].name} & ${sourcePlayers[i + 1].name}`,
          originalOrder: i / 2,
        });
      }

      activeTeams = fallbackTeams;
    }

    const roundRobinRounds = generateRoundRobinRounds(activeTeams);

    setTournament((previous) => ({
      ...previous,
      teams: activeTeams,
      roundRobinRounds,
      roundRobinIndex: 0,
      currentMatches: roundRobinRounds[0] ? roundRobinRounds[0].matches : [],
      currentLabel: roundRobinRounds[0] ? roundRobinRounds[0].label : '',
      stage: 'roundRobin',
      error: '',
      history: [],
      winnerSeeds: [],
      loserSeeds: [],
      winnerChampion: '',
      loserChampion: '',
      champion: '',
      championshipMatch: null,
      bracketRoundNumber: 1,
      loserBracketRoundNumber: 1,
    }));

    setPhase('tournamentRound');
    setTournamentWarning('');
  }

  function getTournamentStandings(roundRobinRounds) {
    const standings = tournament.teams.map((team) => ({
      name: team.displayName,
      wins: 0,
      losses: 0,
      played: 0,
      originalOrder: team.originalOrder,
    }));

    roundRobinRounds.forEach((round) => {
      round.matches.forEach((match) => {
        if (!match.winner) {
          return;
        }

        const teamARecord = standings.find((standing) => standing.name === match.teamA);
        const teamBRecord = standings.find((standing) => standing.name === match.teamB);

        if (teamARecord && teamBRecord) {
          teamARecord.played += 1;
          teamBRecord.played += 1;

          if (match.winner === match.teamA) {
            teamARecord.wins += 1;
            teamBRecord.losses += 1;
          } else {
            teamBRecord.wins += 1;
            teamARecord.losses += 1;
          }
        }
      });
    });

    standings.sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }

      if (a.losses !== b.losses) {
        return a.losses - b.losses;
      }

      return a.originalOrder - b.originalOrder;
    });

    return standings;
  }

  function getBracketLabel(teamCount, bracketTitle, roundNumber) {
    if (teamCount <= 2) {
      return `${bracketTitle} Finals`;
    }

    if (teamCount === 4) {
      return `${bracketTitle} Semifinals`;
    }

    if (teamCount === 8) {
      return `${bracketTitle} Quarterfinals`;
    }

    return `${bracketTitle} Round ${roundNumber}`;
  }

  function createEliminationRound(teamNames, bracketTitle, roundNumber) {
    const names = [...teamNames];
    const matches = [];
    const autoAdvance = [];

    if (names.length % 2 !== 0) {
      autoAdvance.push(names.pop());
    }

    for (let i = 0; i < names.length; i += 2) {
      matches.push({
        id: createId('tournament-match'),
        teamA: names[i],
        teamB: names[i + 1],
        winner: '',
      });
    }

    return {
      label: getBracketLabel(teamNames.length, bracketTitle, roundNumber),
      matches,
      autoAdvance,
    };
  }

  function selectTournamentWinner(matchId, winnerName) {
    setTournament((previous) => ({
      ...previous,
      currentMatches: previous.currentMatches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              winner: winnerName,
            }
          : match
      ),
      error: '',
    }));
    setTournamentWarning('');
  }

  function advanceTournament() {
    if (
      tournament.currentMatches.some(
        (match) => !match.winner && match.teamB && match.teamB !== 'BYE'
      )
    ) {
      setTournamentWarning('Pick winners for all matches first.');
      return;
    }

    setTournamentWarning('');

    if (tournament.stage === 'roundRobin') {
      const updatedRounds = tournament.roundRobinRounds.map((round, index) =>
        index === tournament.roundRobinIndex
          ? {
              ...round,
              matches: tournament.currentMatches,
            }
          : round
      );

      tournament.currentMatches.forEach((match) => {
        addHistoryItem(
          'Tournament',
          tournament.currentLabel,
          `${match.winner} won against ${match.winner === match.teamA ? match.teamB : match.teamA}`
        );
      });

      if (tournament.roundRobinIndex < updatedRounds.length - 1) {
        const nextIndex = tournament.roundRobinIndex + 1;
        setTournament((previous) => ({
          ...previous,
          roundRobinRounds: updatedRounds,
          roundRobinIndex: nextIndex,
          currentMatches: updatedRounds[nextIndex].matches,
          currentLabel: updatedRounds[nextIndex].label,
          history: [
            ...previous.history,
            `${previous.currentLabel} completed.`,
          ],
        }));
        return;
      }

      const standings = getTournamentStandings(updatedRounds);
      const splitPoint = Math.ceil(standings.length / 2);
      const winnerSeeds = standings.slice(0, splitPoint).map((team) => team.name);
      const loserSeeds = standings.slice(splitPoint).map((team) => team.name);

      const winnerRound = createEliminationRound(
        winnerSeeds,
        'Winner Bracket',
        1
      );

      if (winnerSeeds.length === 1 && loserSeeds.length === 1) {
        setTournament((previous) => ({
          ...previous,
          roundRobinRounds: updatedRounds,
          winnerSeeds,
          loserSeeds,
          winnerChampion: winnerSeeds[0],
          loserChampion: loserSeeds[0],
          championshipMatch: {
            id: createId('championship'),
            teamA: winnerSeeds[0],
            teamB: loserSeeds[0],
            winner: '',
          },
          currentMatches: [
            {
              id: createId('championship'),
              teamA: winnerSeeds[0],
              teamB: loserSeeds[0],
              winner: '',
            },
          ],
          currentLabel: 'Championship Final',
          stage: 'championship',
          history: [...previous.history, 'Round Robin completed.'],
        }));
        return;
      }

      if (winnerSeeds.length === 1) {
        const loserRound = createEliminationRound(
          loserSeeds,
          'Loser Bracket',
          1
        );

        setTournament((previous) => ({
          ...previous,
          roundRobinRounds: updatedRounds,
          winnerSeeds,
          loserSeeds,
          winnerChampion: winnerSeeds[0],
          currentMatches: loserRound.matches,
          currentLabel: loserRound.label,
          stage: 'loserBracket',
          history: [...previous.history, 'Round Robin completed.'],
          loserBracketRoundNumber: 1,
        }));
        return;
      }

      setTournament((previous) => ({
        ...previous,
        roundRobinRounds: updatedRounds,
        winnerSeeds,
        loserSeeds,
        currentMatches: winnerRound.matches,
        currentLabel: winnerRound.label,
        stage: 'winnerBracket',
        history: [...previous.history, 'Round Robin completed.'],
        bracketRoundNumber: 1,
      }));
      return;
    }

    if (tournament.stage === 'winnerBracket') {
      const nextWinnerTeams = tournament.currentMatches.map((match) => match.winner);

      if (nextWinnerTeams.length === 1) {
        if (tournament.loserSeeds.length === 1) {
          setTournament((previous) => ({
            ...previous,
            winnerChampion: nextWinnerTeams[0],
            loserChampion: previous.loserSeeds[0],
            currentMatches: [
              {
                id: createId('championship'),
                teamA: nextWinnerTeams[0],
                teamB: previous.loserSeeds[0],
                winner: '',
              },
            ],
            currentLabel: 'Championship Final',
            stage: 'championship',
            history: [...previous.history, `${previous.currentLabel} completed.`],
          }));
          return;
        }

        const loserRound = createEliminationRound(
          tournament.loserSeeds,
          'Loser Bracket',
          1
        );

        setTournament((previous) => ({
          ...previous,
          winnerChampion: nextWinnerTeams[0],
          currentMatches: loserRound.matches,
          currentLabel: loserRound.label,
          stage: 'loserBracket',
          history: [...previous.history, `${previous.currentLabel} completed.`],
          loserBracketRoundNumber: 1,
        }));
        return;
      }

      const nextRoundNumber = tournament.bracketRoundNumber + 1;
      const nextWinnerRound = createEliminationRound(
        nextWinnerTeams,
        'Winner Bracket',
        nextRoundNumber
      );

      setTournament((previous) => ({
        ...previous,
        currentMatches: nextWinnerRound.matches,
        currentLabel: nextWinnerRound.label,
        history: [...previous.history, `${previous.currentLabel} completed.`],
        bracketRoundNumber: nextRoundNumber,
      }));
      return;
    }

    if (tournament.stage === 'loserBracket') {
      const nextLoserTeams = tournament.currentMatches.map((match) => match.winner);

      if (nextLoserTeams.length === 1) {
        setTournament((previous) => ({
          ...previous,
          loserChampion: nextLoserTeams[0],
          currentMatches: [
            {
              id: createId('championship'),
              teamA: previous.winnerChampion,
              teamB: nextLoserTeams[0],
              winner: '',
            },
          ],
          currentLabel: 'Championship Final',
          stage: 'championship',
          history: [...previous.history, `${previous.currentLabel} completed.`],
        }));
        return;
      }

      const nextRoundNumber = tournament.loserBracketRoundNumber + 1;
      const nextLoserRound = createEliminationRound(
        nextLoserTeams,
        'Loser Bracket',
        nextRoundNumber
      );

      setTournament((previous) => ({
        ...previous,
        currentMatches: nextLoserRound.matches,
        currentLabel: nextLoserRound.label,
        history: [...previous.history, `${previous.currentLabel} completed.`],
        loserBracketRoundNumber: nextRoundNumber,
      }));
      return;
    }

    if (tournament.stage === 'championship') {
      const championName = tournament.currentMatches[0].winner;

      if (!championName) {
        setTournamentWarning('Pick winners for all matches first.');
        return;
      }

      addHistoryItem('Tournament', 'Champion crowned', championName);

      setTournament((previous) => ({
        ...previous,
        champion: championName,
        championshipMatch: previous.currentMatches[0],
        history: [...previous.history, `${championName} became champion.`],
        stage: 'complete',
      }));
      setPhase('tournamentChampion');
    }
  }

  function resetTournament() {
    setTournament(defaultTournament);
    setTournamentWarning('');
  }

  function startScoreboardMode(match, source, returnPhase) {
    setScoreboard({
      ...defaultScoreboard,
      teamAName: match ? match.teamA : 'Team A',
      teamBName: match ? match.teamB : 'Team B',
      source: source || null,
      returnPhase: returnPhase || 'menu',
    });
    setPhase('scoreboard');
  }

  function getScoreboardWinner(teamAScore, teamBScore, teamAName, teamBName) {
    if (teamAScore >= 11 || teamBScore >= 11) {
      if (Math.abs(teamAScore - teamBScore) >= 2) {
        return teamAScore > teamBScore ? teamAName : teamBName;
      }
    }

    return '';
  }

  function getScoreboardMatchStatus(teamAScore, teamBScore, winnerName) {
    if (winnerName) {
      return 'Game Finished';
    }

    if (teamAScore === 0 && teamBScore === 0) {
      return 'Ready';
    }

    if (teamAScore >= 10 && teamBScore >= 10) {
      return 'Win by 2';
    }

    if (teamAScore === 10 || teamBScore === 10) {
      return 'Game Point';
    }

    return 'Live Match';
  }

  function handleScoreboardRally(rallyWinner) {
    setScoreboard((previous) => {
      if (previous.winner) {
        return previous;
      }

      const snapshot = {
        teamAScore: previous.teamAScore,
        teamBScore: previous.teamBScore,
        servingTeam: previous.servingTeam,
        serverNumber: previous.serverNumber,
        winner: previous.winner,
        matchStatus: previous.matchStatus,
      };

      let nextTeamAScore = previous.teamAScore;
      let nextTeamBScore = previous.teamBScore;
      let nextServingTeam = previous.servingTeam;
      let nextServerNumber = previous.serverNumber;

      if (rallyWinner === previous.servingTeam) {
        if (rallyWinner === 'A') {
          nextTeamAScore += 1;
        } else {
          nextTeamBScore += 1;
        }
      } else if (previous.serverNumber === 1) {
        nextServerNumber = 2;
      } else {
        nextServingTeam = rallyWinner;
        nextServerNumber = 1;
      }

      const winnerName = getScoreboardWinner(
        nextTeamAScore,
        nextTeamBScore,
        previous.teamAName,
        previous.teamBName
      );

      return {
        ...previous,
        teamAScore: nextTeamAScore,
        teamBScore: nextTeamBScore,
        servingTeam: nextServingTeam,
        serverNumber: nextServerNumber,
        winner: winnerName,
        matchStatus: getScoreboardMatchStatus(
          nextTeamAScore,
          nextTeamBScore,
          winnerName
        ),
        undoStack: [...previous.undoStack, snapshot],
      };
    });
  }

  function adjustScoreboardPoints(team, delta) {
    setScoreboard((previous) => {
      const snapshot = {
        teamAScore: previous.teamAScore,
        teamBScore: previous.teamBScore,
        servingTeam: previous.servingTeam,
        serverNumber: previous.serverNumber,
        winner: previous.winner,
        matchStatus: previous.matchStatus,
      };

      const nextTeamAScore =
        team === 'A'
          ? Math.max(0, previous.teamAScore + delta)
          : previous.teamAScore;
      const nextTeamBScore =
        team === 'B'
          ? Math.max(0, previous.teamBScore + delta)
          : previous.teamBScore;
      const winnerName = getScoreboardWinner(
        nextTeamAScore,
        nextTeamBScore,
        previous.teamAName,
        previous.teamBName
      );

      return {
        ...previous,
        teamAScore: nextTeamAScore,
        teamBScore: nextTeamBScore,
        winner: winnerName,
        matchStatus: getScoreboardMatchStatus(
          nextTeamAScore,
          nextTeamBScore,
          winnerName
        ),
        undoStack: [...previous.undoStack, snapshot],
      };
    });
  }

  function undoScoreboardRally() {
    setScoreboard((previous) => {
      if (previous.undoStack.length === 0) {
        return previous;
      }

      const previousState = previous.undoStack[previous.undoStack.length - 1];

      return {
        ...previous,
        ...previousState,
        undoStack: previous.undoStack.slice(0, -1),
      };
    });
  }

  function saveScoreboardMatch() {
    const winnerName =
      scoreboard.winner ||
      getScoreboardWinner(
        scoreboard.teamAScore,
        scoreboard.teamBScore,
        scoreboard.teamAName,
        scoreboard.teamBName
      ) ||
      'No winner yet';
    const scoreText = `${scoreboard.teamAScore} - ${scoreboard.teamBScore}`;
    const savedMatch = {
      id: createId('score-match'),
      teamA: scoreboard.teamAName,
      teamB: scoreboard.teamBName,
      scoreText,
      winner: winnerName,
      servingTeam:
        scoreboard.servingTeam === 'A'
          ? scoreboard.teamAName
          : scoreboard.teamBName,
      serverNumber: scoreboard.serverNumber,
      createdAt: new Date().toLocaleString(),
    };

    setScoreboard((previous) => ({
      ...previous,
      winner: winnerName,
      matchStatus: 'Saved',
      historyOpen: true,
      savedMatches: [savedMatch, ...previous.savedMatches],
    }));

    addHistoryItem(
      'Scoreboard',
      `${scoreboard.teamAName} vs ${scoreboard.teamBName}`,
      `${scoreText} · Serve: ${
        scoreboard.servingTeam === 'A'
          ? scoreboard.teamAName
          : scoreboard.teamBName
      } · Server ${scoreboard.serverNumber}`
    );

    if (scoreboard.source && winnerName !== 'No winner yet') {
      if (scoreboard.source.type === 'openPlay') {
        recordOpenPlayWinner(scoreboard.source.matchId, winnerName);
      }

      if (scoreboard.source.type === 'tournament') {
        selectTournamentWinner(scoreboard.source.matchId, winnerName);
      }
    }
  }

  function resetScoreboard() {
    setScoreboard((previous) => ({
      ...previous,
      showResetConfirm: true,
    }));
  }

  function cancelScoreboardReset() {
    setScoreboard((previous) => ({
      ...previous,
      showResetConfirm: false,
    }));
  }

  function confirmScoreboardReset() {

    setScoreboard((previous) => ({
      ...defaultScoreboard,
      teamAName: previous.teamAName,
      teamBName: previous.teamBName,
      source: previous.source,
      returnPhase: previous.returnPhase,
      savedMatches: previous.savedMatches,
      historyOpen: previous.historyOpen,
      showResetConfirm: false,
    }));
  }

  function toggleManualServe() {
    setScoreboard((previous) => ({
      ...previous,
      servingTeam: previous.servingTeam === 'A' ? 'B' : 'A',
      serverNumber: 1,
      matchStatus: getScoreboardMatchStatus(
        previous.teamAScore,
        previous.teamBScore,
        previous.winner
      ),
    }));
  }

  const tournamentStandings = useMemo(
    () => getTournamentStandings(tournament.roundRobinRounds),
    [tournament.roundRobinRounds, tournament.teams]
  );

  const openPlayCourtBoards = useMemo(() => {
    return Array.from({ length: openPlay.courts }, (_, index) => {
      const courtNumber = index + 1;
      const courtRounds = openPlay.rounds
        .map((round) => {
          const match = round.matches.find((item) => item.court === courtNumber);
          return match
            ? {
                round: round.round,
                ...match,
              }
            : null;
        })
        .filter(Boolean)
        .reverse();

      return {
        courtNumber,
        rounds: courtRounds,
      };
    });
  }, [openPlay.courts, openPlay.rounds]);

  function renderMenuCard(icon, title, subtitle, onClick, accentClass) {
    return (
      <button className={`menu-card ${accentClass}`} onClick={onClick} type="button">
        <div className="menu-card-icon">{icon}</div>
        <div className="menu-card-content">
          <div className="menu-card-title">{title}</div>
          <div className="menu-card-subtitle">{subtitle}</div>
        </div>
        <div className="menu-card-arrow">›</div>
      </button>
    );
  }

  return (
    <div className="app">
      <div className="app-shell">
        {phase === 'menu' && (
          <div className="screen">
            <div className="hero-card glass-card">
              <div className="hero-orb hero-orb-left" />
              <div className="hero-orb hero-orb-right" />
              <div className="hero-inner">
                <div className="hero-badge">Pickleball Organizer</div>
                <div className="hero-logo">
                  <img src={logo} alt="DinkSide logo" />
                </div>
                <div className="hero-title">DINK SIDE</div>
                <div className="hero-subtitle">Pickleball Match Organizer</div>
              </div>
            </div>

            <div className="menu-stack">
              {renderMenuCard(
                <span className="menu-icon-emoji" role="img" aria-label="open play">
                  🏓
                </span>,
                'Open Play',
                'Randomize players & courts',
                () => setPhase('openPlay'),
                'open-accent'
              )}
              {renderMenuCard(
                <span className="menu-icon-emoji" role="img" aria-label="tournament">
                  🏆
                </span>,
                'Tournament',
                'Round robin & brackets',
                () => setPhase('tournamentSetup'),
                'tournament-accent'
              )}
              {renderMenuCard(
                <span className="menu-icon-emoji" role="img" aria-label="scoreboard">
                  📋
                </span>,
                'Scoreboard',
                'Pickleball match scoring',
                () => startScoreboardMode(null, null, 'menu'),
                'scoreboard-accent'
              )}
              {renderMenuCard(
                <span className="menu-icon-emoji" role="img" aria-label="match history">
                  🕘
                </span>,
                'Match History',
                'Open Play, Tournament, Scoreboard',
                () => setPhase('history'),
                'history-accent'
              )}
            </div>

            <button
              className="soft-danger-btn"
              onClick={resetWholeApp}
              type="button"
            >
              Reset App
            </button>

            <div className="footer-text">
              Panabo City · 2026
            </div>
          </div>
        )}

        {phase === 'openPlay' && (
          <div className="screen">
            <div className="screen-header">
              <button className="back-btn" onClick={() => setPhase('menu')} type="button">
                ←
              </button>
              <div>
                <div className="screen-title">Open Play</div>
                <div className="screen-subtitle">Rotate players and courts fairly</div>
              </div>
            </div>

            <div className="glass-card">
              <div className="section-header">
                <span>Number of Courts</span>
              </div>
              <div className="counter-box">
                <button className="counter-btn" onClick={() => adjustOpenPlayCourts(-1)} type="button">
                  -
                </button>
                <div className="counter-value">{openPlay.courts}</div>
                <button className="counter-btn" onClick={() => adjustOpenPlayCourts(1)} type="button">
                  +
                </button>
              </div>
            </div>

            <div className="glass-card">
              <div className="section-header with-badge">
                <span>Players</span>
                <span className="count-badge">{openPlay.players.length}</span>
              </div>

              <div className="input-row">
                <input
                  className="app-input"
                  value={openPlay.playerInput}
                  onChange={(event) => updateOpenPlayPlayerInput(event.target.value)}
                  placeholder="Enter player name"
                />
                <button className="gradient-btn add-btn" onClick={addOpenPlayPlayer} type="button">
                  Add
                </button>
              </div>

              <div className="player-stack">
                {openPlay.players.map((player, index) => (
                  <div className="player-row" key={player.id}>
                    <div className="player-left">
                      <span className="number-pill">{index + 1}</span>
                      <span>{player.name}</span>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={() => removeOpenPlayPlayer(player.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              {openPlay.error && <div className="warning-box">{openPlay.error}</div>}

              <div className="button-row">
                <button className="gradient-btn full-btn" onClick={generateOpenPlayRound} type="button">
                  Generate Matches
                </button>
              </div>
            </div>

            {openPlay.currentMatches.length > 0 && (
              <div className="glass-card">
                <div className="section-header with-badge">
                  <span>Active Courts</span>
                  <span className="count-badge">Latest Round {openPlay.currentRound}</span>
                </div>

                <div className="court-grid">
                  {openPlay.currentMatches.map((match) => (
                    <div className="court-match-card" key={match.id}>
                      <div className="court-card-top">
                        <div className="court-label">COURT {match.court}</div>
                        <div className="count-badge small-badge">R{match.round}</div>
                      </div>
                      <div className="team-vs-block">
                        <div className={`team-chip ${match.winner === match.teamA ? 'selected-team' : ''}`}>
                          {match.teamA}
                        </div>
                        <div className="vs-text">VS</div>
                        <div className={`team-chip ${match.winner === match.teamB ? 'selected-team teal-team' : 'teal-team'}`}>
                          {match.teamB}
                        </div>
                      </div>
                      <div className="button-row">
                        <button
                          className="soft-btn"
                          onClick={() =>
                            startScoreboardMode(
                              match,
                              { type: 'openPlay', matchId: match.id },
                              'openPlay'
                            )
                          }
                          type="button"
                        >
                          Open Scoreboard
                        </button>
                        <button
                          className="gold-btn"
                          onClick={() => recordOpenPlayWinner(match.id, match.teamA)}
                          type="button"
                        >
                          Team A Wins
                        </button>
                        <button
                          className="gold-btn"
                          onClick={() => recordOpenPlayWinner(match.id, match.teamB)}
                          type="button"
                        >
                          Team B Wins
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-card">
              <div className="section-header with-badge">
                <span>Waiting</span>
                <span className="count-badge">{openPlay.waitingPlayers.length}</span>
              </div>
              {openPlay.waitingPlayers.length === 0 ? (
                <div className="muted-text">No players waiting this round.</div>
              ) : (
                <div className="waiting-list">
                  {openPlay.waitingPlayers.map((player) => (
                    <span className="waiting-pill" key={player}>
                      {player}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="glass-card">
              <div className="section-header">
                <span>Court Timeline</span>
              </div>
              <div className="court-board-grid">
                {openPlayCourtBoards.map((court) => (
                  <div className="court-board" key={court.courtNumber}>
                    <div className="court-board-title">Court {court.courtNumber}</div>
                    <div className="round-mini-grid">
                      {court.rounds.length === 0 ? (
                        <div className="round-mini-card empty-mini-card">No rounds yet</div>
                      ) : (
                        court.rounds.map((roundItem) => (
                          <div className="round-mini-card" key={roundItem.id}>
                            <div className="mini-round-label">R{roundItem.round}</div>
                            <div className="mini-round-match">{roundItem.teamA}</div>
                            <div className="mini-round-vs">VS</div>
                            <div className="mini-round-match">{roundItem.teamB}</div>
                            {roundItem.winner && (
                              <div className="mini-round-winner">Winner: {roundItem.winner}</div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card">
              <div className="section-header">Open Play History</div>
              <div className="history-stack">
                {openPlay.results.length === 0 ? (
                  <div className="history-card muted-text">No open play results yet.</div>
                ) : (
                  openPlay.results.map((result) => (
                    <div className="history-card" key={result.id}>
                      <div className="history-title">
                        Round {result.round} · Court {result.court}
                      </div>
                      <div className="history-subtitle">
                        {result.teamA} vs {result.teamB}
                      </div>
                      <div className="history-highlight">Winner: {result.winner}</div>
                      <div className="history-time">{result.createdAt}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {phase === 'tournamentSetup' && (
          <div className="screen">
            <div className="screen-header">
              <button className="back-btn" onClick={() => setPhase('menu')} type="button">
                ←
              </button>
              <div>
                <div className="screen-title">Tournament</div>
                <div className="screen-subtitle">Create players and lock permanent teams</div>
              </div>
            </div>

            <div className="glass-card">
              <div className="section-header with-badge">
                <span>Players</span>
                <span className="count-badge">{tournament.players.length}</span>
              </div>

              <div className="input-row">
                <input
                  className="app-input"
                  value={tournament.playerInput}
                  onChange={(event) => updateTournamentPlayerInput(event.target.value)}
                  placeholder="Enter player name"
                />
                <button className="gradient-btn add-btn" onClick={addTournamentPlayer} type="button">
                  Add
                </button>
              </div>

              <div className="player-stack">
                {tournament.players.map((player, index) => (
                  <div className="player-row" key={player.id}>
                    <div className="player-left">
                      <span className="number-pill">{index + 1}</span>
                      <span>{player.name}</span>
                    </div>
                    <button
                      className="delete-btn"
                      onClick={() => removeTournamentPlayer(player.id)}
                      type="button"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>

              {tournament.error && <div className="warning-box">{tournament.error}</div>}

              <div className="button-row split-buttons">
                <button
                  className="soft-btn"
                  onClick={() => createTournamentTeams(true)}
                  type="button"
                >
                  Auto Pair
                </button>
                <button className="gold-btn full-btn" onClick={startTournament} type="button">
                  Start Tournament
                </button>
              </div>
            </div>

            {tournament.teams.length > 0 && (
              <div className="glass-card">
                <div className="section-header">Teams</div>
                <div className="history-stack">
                  {tournament.teams.map((team, index) => (
                    <div className="history-card" key={team.id}>
                      <div className="history-title">Team {index + 1}</div>
                      <div className="history-subtitle">{team.displayName}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {phase === 'tournamentRound' && (
          <div className="screen">
            <div className="screen-header">
              <button
                className="back-btn"
                onClick={() => setPhase('tournamentSetup')}
                type="button"
              >
                ←
              </button>
              <div>
                <div className="screen-title">Tournament</div>
                <div className="screen-subtitle">{tournament.currentLabel}</div>
              </div>
            </div>

            <div className="glass-card">
              <div className="round-pill">{tournament.currentLabel || 'Round 1'}</div>
              <div className="history-stack">
                {tournament.currentMatches.map((match) => (
                  <div className="tournament-match-card" key={match.id}>
                    <div
                      className={`tournament-team-row ${
                        match.winner === match.teamA
                          ? 'winner-row'
                          : match.winner
                          ? 'loser-row'
                          : ''
                      }`}
                    >
                      <span>{match.teamA}</span>
                      <button
                        className={`soft-btn small-soft-btn ${
                          match.winner === match.teamA
                            ? 'winner-btn'
                            : match.winner
                            ? 'loser-btn'
                            : ''
                        }`}
                        onClick={() => selectTournamentWinner(match.id, match.teamA)}
                        type="button"
                      >
                        WIN
                      </button>
                    </div>
                    <div className="versus-label">VS</div>
                    <div
                      className={`tournament-team-row ${
                        match.winner === match.teamB
                          ? 'winner-row'
                          : match.winner
                          ? 'loser-row'
                          : 'mint-row'
                      }`}
                    >
                      <span>{match.teamB}</span>
                      <button
                        className={`soft-btn small-soft-btn ${
                          match.winner === match.teamB
                            ? 'winner-btn'
                            : match.winner
                            ? 'loser-btn'
                            : ''
                        }`}
                        onClick={() => selectTournamentWinner(match.id, match.teamB)}
                        type="button"
                      >
                        WIN
                      </button>
                    </div>
                    <div className="button-row">
                      <button
                        className="gradient-btn full-btn"
                        onClick={() =>
                          startScoreboardMode(
                            match,
                            { type: 'tournament', matchId: match.id },
                            'tournamentRound'
                          )
                        }
                        type="button"
                      >
                        Open Scoreboard
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {tournamentWarning && <div className="warning-box">{tournamentWarning}</div>}

              <div className="button-row split-buttons">
                <button className="gold-btn" onClick={advanceTournament} type="button">
                  Next Round
                </button>
                <button className="soft-danger-btn" onClick={resetTournament} type="button">
                  Reset Tournament
                </button>
              </div>
            </div>

            <div className="glass-card">
              <div className="section-header">Standings</div>
              <div className="table-wrap">
                <table className="glass-table">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>Wins</th>
                      <th>Losses</th>
                      <th>Played</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tournamentStandings.map((team) => (
                      <tr key={team.name}>
                        <td>{team.name}</td>
                        <td>{team.wins}</td>
                        <td>{team.losses}</td>
                        <td>{team.played}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {phase === 'tournamentChampion' && (
          <div className="screen">
            <div className="screen-header">
              <button className="back-btn" onClick={() => setPhase('menu')} type="button">
                ←
              </button>
              <div>
                <div className="screen-title">Tournament</div>
                <div className="screen-subtitle">Champion View</div>
              </div>
            </div>

            <div className="champion-card">
              <div className="trophy-icon">🏆</div>
              <div className="champion-label">CHAMPION</div>
              <div className="champion-name">{tournament.champion}</div>
              <button
                className="gold-btn full-btn"
                onClick={() => {
                  resetTournament();
                  setPhase('tournamentSetup');
                }}
                type="button"
              >
                New Tournament
              </button>
            </div>
          </div>
        )}

        {phase === 'scoreboard' && (
          <div className="screen">
            <div className="screen-header">
              <button
                className="back-btn"
                onClick={() => setPhase(scoreboard.returnPhase || 'menu')}
                type="button"
              >
                ←
              </button>
              <div>
                <div className="screen-title">Scoreboard</div>
                <div className="screen-subtitle">Pickleball match scoring</div>
              </div>
            </div>

            <div className="scoreboard-card">
              <div className="live-label">LIVE SCORE</div>

              <div className="serve-center">
                <button
                  className={`serve-pill scoreboard-serve-pill ${
                    scoreboard.servingTeam === 'A' ? 'active-serve' : 'serve-team-b'
                  }`}
                  onClick={toggleManualServe}
                  type="button"
                >
                  Serve: {scoreboard.servingTeam === 'A' ? scoreboard.teamAName : scoreboard.teamBName}
                </button>
              </div>

              <div className="scoreboard-stack">
                <div
                  className={`score-panel ${
                    scoreboard.servingTeam === 'A' ? 'serving-panel panel-a' : 'panel-a'
                  }`}
                >
                  <div className="score-panel-top">
                    <div className="score-panel-label">Team A</div>
                    {scoreboard.servingTeam === 'A' && (
                      <div className="serving-chip">Serving</div>
                    )}
                  </div>
                  <input
                    className="team-name-input score-panel-name-input"
                    value={scoreboard.teamAName}
                    onChange={(event) =>
                      setScoreboard((previous) => ({
                        ...previous,
                        teamAName: event.target.value,
                      }))
                    }
                  />
                  <div className="big-score">{scoreboard.teamAScore}</div>
                  <div className="score-adjust-row">
                    <button
                      className="score-btn secondary-score-btn"
                      onClick={() => adjustScoreboardPoints('A', -1)}
                      type="button"
                    >
                      -1 pt
                    </button>
                    <button
                      className="score-btn"
                      onClick={() => adjustScoreboardPoints('A', 1)}
                      type="button"
                    >
                      +1 pt
                    </button>
                  </div>
                  <div className="score-actions score-actions-large">
                    <button
                      className="score-btn"
                      onClick={() => handleScoreboardRally('A')}
                      type="button"
                    >
                      Team A Wins Rally
                    </button>
                  </div>
                </div>

                <div className="center-server-indicator">
                  <div className="center-server-number">Server {scoreboard.serverNumber}</div>
                </div>

                <div
                  className={`score-panel ${
                    scoreboard.servingTeam === 'B' ? 'serving-panel panel-b' : 'panel-b'
                  }`}
                >
                  <div className="score-panel-top">
                    <div className="score-panel-label">Team B</div>
                    {scoreboard.servingTeam === 'B' && (
                      <div className="serving-chip">Serving</div>
                    )}
                  </div>
                  <input
                    className="team-name-input score-panel-name-input"
                    value={scoreboard.teamBName}
                    onChange={(event) =>
                      setScoreboard((previous) => ({
                        ...previous,
                        teamBName: event.target.value,
                      }))
                    }
                  />
                  <div className="big-score">{scoreboard.teamBScore}</div>
                  <div className="score-adjust-row">
                    <button
                      className="score-btn secondary-score-btn"
                      onClick={() => adjustScoreboardPoints('B', -1)}
                      type="button"
                    >
                      -1 pt
                    </button>
                    <button
                      className="score-btn mint-btn"
                      onClick={() => adjustScoreboardPoints('B', 1)}
                      type="button"
                    >
                      +1 pt
                    </button>
                  </div>
                  <div className="score-actions score-actions-large">
                    <button
                      className="score-btn mint-btn"
                      onClick={() => handleScoreboardRally('B')}
                      type="button"
                    >
                      Team B Wins Rally
                    </button>
                  </div>
                </div>
              </div>

              <div className="scoreboard-status-row">
                <div className="status-pill">{scoreboard.matchStatus}</div>
                <div className="status-pill muted-status">
                  {scoreboard.teamAScore}-{scoreboard.teamBScore}
                </div>
              </div>

              {scoreboard.winner && (
                <div className="success-box">Winner: {scoreboard.winner}</div>
              )}

              {scoreboard.showResetConfirm && (
                <div className="scoreboard-confirm-card">
                  <div className="confirm-title">Reset live score?</div>
                  <div className="confirm-text">
                    This will clear both scores and reset the serve back to Team A.
                  </div>
                  <div className="button-row confirm-buttons">
                    <button className="soft-btn" onClick={cancelScoreboardReset} type="button">
                      Cancel
                    </button>
                    <button className="soft-danger-btn" onClick={confirmScoreboardReset} type="button">
                      Reset
                    </button>
                  </div>
                </div>
              )}

              <div className="button-row scoreboard-buttons">
                <button className="soft-btn" onClick={resetScoreboard} type="button">
                  Reset Score
                </button>
                <button className="soft-btn" onClick={undoScoreboardRally} type="button">
                  Undo
                </button>
                <button className="gold-btn" onClick={saveScoreboardMatch} type="button">
                  Save Match
                </button>
                <button
                  className="gradient-btn"
                  onClick={() =>
                    setScoreboard((previous) => ({
                      ...previous,
                      historyOpen: !previous.historyOpen,
                    }))
                  }
                  type="button"
                >
                  View Match History
                </button>
              </div>

              {scoreboard.historyOpen && (
                <div className="scoreboard-history-panel">
                  <div className="section-header">Saved Scoreboard Matches</div>
                  <div className="history-stack">
                    {scoreboard.savedMatches.length === 0 ? (
                      <div className="history-card muted-text">No saved scoreboard matches yet.</div>
                    ) : (
                      scoreboard.savedMatches.map((match) => (
                        <div className="history-card" key={match.id}>
                          <div className="history-title">
                            {match.teamA} vs {match.teamB}
                          </div>
                          <div className="history-subtitle">
                            Score: {match.scoreText} · Serve: {match.servingTeam} · Server {match.serverNumber}
                          </div>
                          <div className="history-highlight">
                            {match.winner === 'No winner yet'
                              ? 'Winner: Not decided'
                              : `Winner: ${match.winner}`}
                          </div>
                          <div className="history-time">{match.createdAt}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {phase === 'history' && (
          <div className="screen">
            <div className="screen-header">
              <button className="back-btn" onClick={() => setPhase('menu')} type="button">
                ←
              </button>
              <div>
                <div className="screen-title">Match History</div>
                <div className="screen-subtitle">Open Play, Tournament, and Scoreboard logs</div>
              </div>
            </div>

            <div className="history-filter-grid">
              <div className="glass-card">
                <div className="section-header">All History</div>
                <div className="history-stack">
                  {historyItems.length === 0 ? (
                    <div className="history-card muted-text">No saved history yet.</div>
                  ) : (
                    historyItems.map((item) => (
                      <div className="history-card" key={item.id}>
                        <div className="history-title">{item.title}</div>
                        <div className="history-subtitle">{item.subtitle}</div>
                        <div className="history-type">{item.type}</div>
                        <div className="history-time">{item.createdAt}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
