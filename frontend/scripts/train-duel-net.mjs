import {
  evaluatePolicy,
  greedyNetPolicy,
  heuristicPolicy,
  randomPolicy,
  trainNetPolicy,
  trainNetSoup,
} from '../src/engine/yugioh-net.ts'

const episodes = Number(process.argv[2] || 4000)
const games = Number(process.argv[3] || 600)
const seed = Number(process.argv[4] || 7)
const holdoutSeed = 918273

const row = (name, result) => ({
  name,
  winRate: `${(result.winRate * 100).toFixed(1)}%`,
  wins: result.wins,
  games: result.games,
  vsUnseenBurn: `${(result.byOpponent.burn.winRate * 100).toFixed(1)}%`,
  invalidActions: result.invalidActions,
})

const linear = trainNetPolicy({ hidden: 0, episodes, seed })
const net = trainNetPolicy({ hidden: 16, episodes, seed })
const soup = trainNetSoup({ seed, baseEpisodes: episodes, specialistEpisodes: Math.round(episodes / 2) })

console.table([
  row('Zufall', evaluatePolicy(randomPolicy, games, holdoutSeed)),
  row('Heuristik', evaluatePolicy(heuristicPolicy, games, holdoutSeed)),
  row('Linear (RL)', evaluatePolicy(greedyNetPolicy(linear.model), games, holdoutSeed)),
  row('Netz 16 (RL)', evaluatePolicy(greedyNetPolicy(net.model), games, holdoutSeed)),
  row('Netz-Soup', evaluatePolicy(greedyNetPolicy(soup.soup), games, holdoutSeed)),
])
console.log(`Soup-Mitglieder: ${soup.included.join(', ')}; Seeds: Training ${seed}, Holdout ${holdoutSeed}`)
