export const PROMPT_SLICES: Record<string, { promptSlice?: string; goldPrompts?: string[] }> = {
  "wont": {
    "promptSlice": "Domäne wont: Parser-Fakten only.",
    "goldPrompts": [
      "Mach ein Foto"
    ]
  },
  "identity": {
    "promptSlice": "Domäne identity: Parser-Fakten only.",
    "goldPrompts": [
      "Bist du ChatGPT?"
    ]
  },
  "tv": {
    "promptSlice": "Fernseher: WoL/Tizen wirklich. Kein Fake-an.",
    "goldPrompts": [
      "Fernseher an",
      "Öffne Netflix"
    ]
  },
  "fan": {
    "promptSlice": "Ventilator: Shelly/Broadlink. Kein Fake.",
    "goldPrompts": [
      "Ventilator an"
    ]
  },
  "plug": {
    "promptSlice": "Domäne plug: Parser-Fakten only.",
    "goldPrompts": [
      "Steckdose an"
    ]
  },
  "device": {
    "promptSlice": "Domäne device: Parser-Fakten only.",
    "goldPrompts": [
      "Taschenlampe an"
    ]
  },
  "amazon": {
    "promptSlice": "Domäne amazon: Parser-Fakten only.",
    "goldPrompts": [
      "Spiel Amazon Music"
    ]
  },
  "app": {
    "promptSlice": "Domäne app: Parser-Fakten only.",
    "goldPrompts": [
      "Zeig Chat"
    ]
  },
  "film": {
    "promptSlice": "Domäne film: Parser-Fakten only.",
    "goldPrompts": [
      "Wie gut ist Dune"
    ]
  },
  "drive": {
    "promptSlice": "Fahrmodus: Spotify/Overlay ehrlich.",
    "goldPrompts": [
      "Öffne CarPlay"
    ]
  },
  "maps": {
    "promptSlice": "Domäne maps: Parser-Fakten only.",
    "goldPrompts": [
      "Freundin wohnt in Heilbronn"
    ]
  },
  "here": {
    "promptSlice": "Domäne here: Parser-Fakten only.",
    "goldPrompts": [
      "Wo bin ich gerade?"
    ]
  },
  "fuel": {
    "promptSlice": "Domäne fuel: Parser-Fakten only.",
    "goldPrompts": [
      "nächste Tankstelle"
    ]
  },
  "poi": {
    "promptSlice": "Domäne poi: Parser-Fakten only.",
    "goldPrompts": [
      "nächster Lidl"
    ]
  },
  "transit": {
    "promptSlice": "Domäne transit: Parser-Fakten only.",
    "goldPrompts": [
      "Mit der Bahn nach Stuttgart"
    ]
  },
  "taxi": {
    "promptSlice": "Domäne taxi: Parser-Fakten only.",
    "goldPrompts": [
      "bestell ein Taxi"
    ]
  },
  "leave": {
    "promptSlice": "Domäne leave: Parser-Fakten only.",
    "goldPrompts": [
      "Wann muss ich zum Zahnarzt los?"
    ]
  },
  "blitzer": {
    "promptSlice": "Domäne blitzer: Parser-Fakten only.",
    "goldPrompts": [
      "Gibt es Blitzer?"
    ]
  },
  "hud": {
    "promptSlice": "Domäne hud: Parser-Fakten only.",
    "goldPrompts": [
      "Kugel an"
    ]
  },
  "trace": {
    "promptSlice": "Domäne trace: Parser-Fakten only.",
    "goldPrompts": [
      "Was ist traceroute"
    ]
  },
  "calendar": {
    "promptSlice": "Domäne calendar: Parser-Fakten only.",
    "goldPrompts": [
      "Termin morgen 15 Uhr Zahnarzt"
    ]
  },
  "alarm": {
    "promptSlice": "Domäne alarm: Parser-Fakten only.",
    "goldPrompts": [
      "Wecker 7 Uhr"
    ]
  },
  "timer": {
    "promptSlice": "Domäne timer: Parser-Fakten only.",
    "goldPrompts": [
      "Timer 8 Minuten Nudeln"
    ]
  },
  "reminder": {
    "promptSlice": "Domäne reminder: Parser-Fakten only.",
    "goldPrompts": [
      "in 20 Minuten Milch"
    ]
  },
  "todo": {
    "promptSlice": "Domäne todo: Parser-Fakten only.",
    "goldPrompts": [
      "Todo: Testdebug Milch"
    ]
  },
  "idea": {
    "promptSlice": "Idee festhalten, Überblick, Sprintplan auf Zuruf.",
    "goldPrompts": [
      "Idee: Körper und Chat gleichzeitig"
    ]
  },
  "watchlist": {
    "promptSlice": "Watchliste und Lieblinge. Keine erfundenen Titel.",
    "goldPrompts": [
      "Watchliste: Dune",
      "Nenn mir Horrorfilme für Filmabend"
    ]
  },
  "osint": {
    "promptSlice": "Passive Lookups. Kein Scan, keine Leaks.",
    "goldPrompts": [
      "WHOIS example.com"
    ]
  },
  "brief": {
    "promptSlice": "Domäne brief: Parser-Fakten only.",
    "goldPrompts": [
      "Was steht an?"
    ]
  },
  "birthday": {
    "promptSlice": "Domäne birthday: Parser-Fakten only.",
    "goldPrompts": [
      "Mama hat am 3. März Geburtstag"
    ]
  },
  "holiday": {
    "promptSlice": "Domäne holiday: Parser-Fakten only.",
    "goldPrompts": [
      "Ist heute Feiertag?"
    ]
  },
  "ferien": {
    "promptSlice": "Domäne ferien: Parser-Fakten only.",
    "goldPrompts": [
      "Wann sind die Schulferien in Baden-Württemberg?"
    ]
  },
  "shopping": {
    "promptSlice": "Einkauf: Liste, kein Shop-Fake.",
    "goldPrompts": [
      "Milch auf die Einkaufsliste"
    ]
  },
  "home": {
    "promptSlice": "Domäne home: Parser-Fakten only.",
    "goldPrompts": [
      "Wenn ich zuhause bin Müll raus"
    ]
  },
  "watch-price": {
    "promptSlice": "Domäne watch-price: Parser-Fakten only.",
    "goldPrompts": [
      "Sag Bescheid wenn Instanudeln im Angebot sind"
    ]
  },
  "chat-folder": {
    "promptSlice": "Domäne chat-folder: Parser-Fakten only.",
    "goldPrompts": [
      "Leg den Chat in Arbeit"
    ]
  },
  "weather": {
    "promptSlice": "Wetter: nur Open-Meteo-Fakten.",
    "goldPrompts": [
      "Wetter heute",
      "Wie wird das Wetter?"
    ]
  },
  "news": {
    "promptSlice": "Domäne news: Parser-Fakten only.",
    "goldPrompts": [
      "Nachrichten"
    ]
  },
  "outlook": {
    "promptSlice": "Domäne outlook: Parser-Fakten only.",
    "goldPrompts": [
      "Was ist die Weltlage?"
    ]
  },
  "search": {
    "promptSlice": "Domäne search: Parser-Fakten only.",
    "goldPrompts": [
      "Wann hatte ich das mit der Steuer?"
    ]
  },
  "warn": {
    "promptSlice": "Domäne warn: Parser-Fakten only.",
    "goldPrompts": [
      "Gibt es Unwetter?"
    ]
  },
  "fx": {
    "promptSlice": "Domäne fx: Parser-Fakten only.",
    "goldPrompts": [
      "Was ist der Dollar?"
    ]
  },
  "sport": {
    "promptSlice": "Domäne sport: Parser-Fakten only.",
    "goldPrompts": [
      "Wie steht die Bundesliga?"
    ]
  },
  "sky": {
    "promptSlice": "Domäne sky: Parser-Fakten only.",
    "goldPrompts": [
      "Wo ist die ISS?"
    ]
  },
  "nature": {
    "promptSlice": "Domäne nature: Parser-Fakten only.",
    "goldPrompts": [
      "welche Pflanze ist das: Gänseblümchen"
    ]
  },
  "flights": {
    "promptSlice": "Domäne flights: Parser-Fakten only.",
    "goldPrompts": [
      "Was fliegt da"
    ]
  },
  "food": {
    "promptSlice": "Domäne food: Parser-Fakten only.",
    "goldPrompts": [
      "Zutaten von Nutella"
    ]
  },
  "library": {
    "promptSlice": "Domäne library: Parser-Fakten only.",
    "goldPrompts": [
      "Wer schrieb Der Prozess?"
    ]
  },
  "law": {
    "promptSlice": "Domäne law: Parser-Fakten only.",
    "goldPrompts": [
      "Darf ich im Park grillen?"
    ]
  },
  "haushalt": {
    "promptSlice": "Domäne haushalt: Parser-Fakten only.",
    "goldPrompts": [
      "Was bedeutet Waschschüssel 40?"
    ]
  },
  "sensors": {
    "promptSlice": "Domäne sensors: Parser-Fakten only.",
    "goldPrompts": [
      "Wie viele Schritte"
    ]
  },
  "chess": {
    "promptSlice": "Domäne chess: Parser-Fakten only.",
    "goldPrompts": [
      "Lass uns Schach spielen",
      "Schach",
      "Bauer e2 e4"
    ]
  },
  "digest": {
    "promptSlice": "Domäne digest: Parser-Fakten only.",
    "goldPrompts": [
      "Fass das Gespräch zusammen"
    ]
  },
  "memory": {
    "promptSlice": "Gedächtnis: merken/vergessen ehrlich.",
    "goldPrompts": [
      "Ich heiße Max und trinke gerne Kaffee.",
      "Ich heiße Max"
    ]
  },
  "recall": {
    "promptSlice": "Domäne recall: Parser-Fakten only.",
    "goldPrompts": [
      "Was weißt du über den Zahnarzt"
    ]
  },
  "teach": {
    "promptSlice": "Domäne teach: Parser-Fakten only.",
    "goldPrompts": [
      "Lern das als Fachwissen FritzBox-Doku: Das WLAN-Passwort steht unter dem Router, nicht im Chat."
    ]
  },
  "pack": {
    "promptSlice": "Domäne pack: Parser-Fakten only.",
    "goldPrompts": [
      "Fachwissen FritzBox"
    ]
  },
  "pc": {
    "promptSlice": "Domäne pc: Parser-Fakten only.",
    "goldPrompts": [
      "FIFA starten"
    ]
  },
  "eye": {
    "promptSlice": "Domäne eye: Parser-Fakten only.",
    "goldPrompts": [
      "Lies das Foto"
    ]
  },
  "doc": {
    "promptSlice": "Domäne doc: Parser-Fakten only.",
    "goldPrompts": [
      "Lies das PDF"
    ]
  },
  "desk": {
    "promptSlice": "Domäne desk: Parser-Fakten only.",
    "goldPrompts": [
      "Schreibtisch an"
    ]
  },
  "backup": {
    "promptSlice": "Domäne backup: Parser-Fakten only.",
    "goldPrompts": [
      "Hausstand exportieren"
    ]
  },
  "face": {
    "promptSlice": "Domäne face: Parser-Fakten only.",
    "goldPrompts": [
      "Friday"
    ]
  }
}
