/** Jarvis-Stand FC 26 — benannte Näherung, nicht der EA-Kernel. */

export type FcPlayer = {
  name: string
  pos: string
  age: number
  ovr: number
  pot: number
  club: string
}

export const FC26_START_YEAR = 2025

export const FC26_PLAYERS: FcPlayer[] = [
  { name: 'Kylian Mbappé', pos: 'ST', age: 26, ovr: 91, pot: 92, club: 'Real Madrid' },
  { name: 'Erling Haaland', pos: 'ST', age: 25, ovr: 91, pot: 93, club: 'Manchester City' },
  { name: 'Vinícius Júnior', pos: 'LW', age: 25, ovr: 90, pot: 92, club: 'Real Madrid' },
  { name: 'Jude Bellingham', pos: 'CM', age: 22, ovr: 90, pot: 94, club: 'Real Madrid' },
  { name: 'Rodri', pos: 'CDM', age: 29, ovr: 90, pot: 90, club: 'Manchester City' },
  { name: 'Harry Kane', pos: 'ST', age: 32, ovr: 90, pot: 90, club: 'Bayern München' },
  { name: 'Lamine Yamal', pos: 'RW', age: 18, ovr: 89, pot: 95, club: 'Barcelona' },
  { name: 'Pedri', pos: 'CM', age: 22, ovr: 89, pot: 93, club: 'Barcelona' },
  { name: 'Jamal Musiala', pos: 'CAM', age: 22, ovr: 88, pot: 92, club: 'Bayern München' },
  { name: 'Florian Wirtz', pos: 'CAM', age: 22, ovr: 88, pot: 92, club: 'Liverpool' },
  { name: 'Bukayo Saka', pos: 'RW', age: 24, ovr: 87, pot: 90, club: 'Arsenal' },
  { name: 'Phil Foden', pos: 'RW', age: 25, ovr: 87, pot: 89, club: 'Manchester City' },
  { name: 'Virgil van Dijk', pos: 'CB', age: 34, ovr: 89, pot: 89, club: 'Liverpool' },
  { name: 'Ruben Dias', pos: 'CB', age: 28, ovr: 88, pot: 88, club: 'Manchester City' },
  { name: 'William Saliba', pos: 'CB', age: 24, ovr: 86, pot: 89, club: 'Arsenal' },
  { name: 'Alessandro Bastoni', pos: 'CB', age: 26, ovr: 87, pot: 89, club: 'Inter' },
  { name: 'Theo Hernández', pos: 'LB', age: 27, ovr: 86, pot: 87, club: 'Milan' },
  { name: 'Alphonso Davies', pos: 'LB', age: 25, ovr: 85, pot: 87, club: 'Bayern München' },
  { name: 'Trent Alexander-Arnold', pos: 'RB', age: 26, ovr: 86, pot: 87, club: 'Real Madrid' },
  { name: 'Achraf Hakimi', pos: 'RB', age: 27, ovr: 86, pot: 86, club: 'PSG' },
  { name: 'Gianluigi Donnarumma', pos: 'GK', age: 26, ovr: 89, pot: 90, club: 'Manchester City' },
  { name: 'Thibaut Courtois', pos: 'GK', age: 33, ovr: 89, pot: 89, club: 'Real Madrid' },
  { name: 'Manuel Neuer', pos: 'GK', age: 39, ovr: 86, pot: 86, club: 'Bayern München' },
  { name: 'Kevin De Bruyne', pos: 'CM', age: 34, ovr: 87, pot: 87, club: 'Napoli' },
  { name: 'Luka Modrić', pos: 'CM', age: 40, ovr: 85, pot: 85, club: 'Milan' },
  { name: 'Toni Kroos', pos: 'CM', age: 35, ovr: 86, pot: 86, club: '—' },
  { name: 'Cole Palmer', pos: 'CAM', age: 23, ovr: 86, pot: 89, club: 'Chelsea' },
  { name: 'Xavi Simons', pos: 'CAM', age: 22, ovr: 83, pot: 88, club: 'RB Leipzig' },
  { name: 'Arda Güler', pos: 'CAM', age: 20, ovr: 80, pot: 88, club: 'Real Madrid' },
  { name: 'Endrick', pos: 'ST', age: 19, ovr: 77, pot: 91, club: 'Real Madrid' },
  { name: 'Kobbie Mainoo', pos: 'CM', age: 20, ovr: 78, pot: 87, club: 'Manchester United' },
  { name: 'Warren Zaïre-Emery', pos: 'CM', age: 19, ovr: 80, pot: 88, club: 'PSG' },
  { name: 'João Palhinha', pos: 'CDM', age: 30, ovr: 84, pot: 84, club: 'Bayern München' },
  { name: 'Declan Rice', pos: 'CDM', age: 26, ovr: 87, pot: 88, club: 'Arsenal' },
  { name: 'Eduardo Camavinga', pos: 'CM', age: 22, ovr: 84, pot: 89, club: 'Real Madrid' },
  { name: 'Aurélien Tchouaméni', pos: 'CDM', age: 25, ovr: 85, pot: 88, club: 'Real Madrid' },
  { name: 'Joshua Kimmich', pos: 'CDM', age: 30, ovr: 87, pot: 87, club: 'Bayern München' },
  { name: 'Mohamed Salah', pos: 'RW', age: 33, ovr: 89, pot: 89, club: 'Liverpool' },
  { name: 'Robert Lewandowski', pos: 'ST', age: 37, ovr: 88, pot: 88, club: 'Barcelona' },
  { name: 'Lautaro Martínez', pos: 'ST', age: 28, ovr: 89, pot: 89, club: 'Inter' },
  { name: 'Alexander Isak', pos: 'ST', age: 26, ovr: 87, pot: 89, club: 'Liverpool' },
  { name: 'Victor Osimhen', pos: 'ST', age: 26, ovr: 87, pot: 88, club: 'Galatasaray' },
  { name: 'Khvicha Kvaratskhelia', pos: 'LW', age: 24, ovr: 86, pot: 88, club: 'PSG' },
  { name: 'Rafael Leão', pos: 'LW', age: 26, ovr: 86, pot: 87, club: 'Milan' },
  { name: 'Nico Williams', pos: 'LW', age: 23, ovr: 85, pot: 89, club: 'Athletic Club' },
  { name: 'Bradley Barcola', pos: 'LW', age: 23, ovr: 83, pot: 88, club: 'PSG' },
  { name: 'Kenan Yıldız', pos: 'CAM', age: 20, ovr: 79, pot: 88, club: 'Juventus' },
  { name: 'Pau Cubarsí', pos: 'CB', age: 18, ovr: 78, pot: 88, club: 'Barcelona' },
  { name: 'Leny Yoro', pos: 'CB', age: 19, ovr: 78, pot: 87, club: 'Manchester United' },
  { name: 'Jorrel Hato', pos: 'CB', age: 19, ovr: 77, pot: 87, club: 'Chelsea' },
  { name: 'Antonio Rüdiger', pos: 'CB', age: 32, ovr: 86, pot: 86, club: 'Real Madrid' },
  { name: 'Mats Hummels', pos: 'CB', age: 36, ovr: 82, pot: 82, club: '—' },
  { name: 'Thiago Silva', pos: 'CB', age: 40, ovr: 82, pot: 82, club: 'Fluminense' },
  { name: 'Ilkay Gündogan', pos: 'CM', age: 34, ovr: 84, pot: 84, club: 'Galatasaray' },
  { name: 'Granit Xhaka', pos: 'CM', age: 32, ovr: 84, pot: 84, club: 'Leverkusen' },
  { name: 'Serhou Guirassy', pos: 'ST', age: 29, ovr: 85, pot: 85, club: 'Dortmund' },
  { name: 'Deniz Undav', pos: 'ST', age: 29, ovr: 81, pot: 81, club: 'Stuttgart' },
  { name: 'Chris Führich', pos: 'LW', age: 27, ovr: 80, pot: 81, club: 'Stuttgart' },
  { name: 'Angelo Stiller', pos: 'CDM', age: 24, ovr: 82, pot: 86, club: 'Stuttgart' },
  { name: 'Aleksandar Pavlović', pos: 'CDM', age: 21, ovr: 79, pot: 87, club: 'Bayern München' },
]

export function estimateOvr(p: FcPlayer, careerYear: number): number {
  const elapsed = Math.max(0, careerYear - FC26_START_YEAR)
  const yearsToPeak = Math.max(1, 29 - p.age)
  const t = Math.min(1, elapsed / yearsToPeak)
  const grown = Math.round(p.ovr + (p.pot - p.ovr) * t)
  const decline = p.age + elapsed >= 34 ? Math.max(0, p.age + elapsed - 33) : 0
  return Math.max(50, Math.min(99, grown - decline))
}

export function findPlayer(name: string): FcPlayer | undefined {
  const q = name.trim().toLowerCase()
  return (
    FC26_PLAYERS.find((p) => p.name.toLowerCase() === q) ||
    FC26_PLAYERS.find((p) => p.name.toLowerCase().includes(q) || q.includes(p.name.split(' ').pop()!.toLowerCase()))
  )
}
