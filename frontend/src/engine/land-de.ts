/** Bundesland aus Ort oder Kürzel — gleiche Zuordnung wie Feiertage. */

const LANDS: Array<{ code: string; api: string; name: string; re: RegExp }> = [
  { code: 'DE-BW', api: 'BW', name: 'Baden-Württemberg', re: /baden|württemb|wuerttemb|\bbw\b|stuttgart|heilbronn|karlsruhe|mannheim|ingersheim|ingesheim|ulm/i },
  { code: 'DE-BY', api: 'BY', name: 'Bayern', re: /bayern|\bby\b|münchen|muenchen|nürnberg|nuernberg|augsburg/i },
  { code: 'DE-BE', api: 'BE', name: 'Berlin', re: /berlin|\bbe\b/i },
  { code: 'DE-BB', api: 'BB', name: 'Brandenburg', re: /brandenburg|potsdam|\bbb\b/i },
  { code: 'DE-HB', api: 'HB', name: 'Bremen', re: /\bbremen\b|\bhb\b/i },
  { code: 'DE-HH', api: 'HH', name: 'Hamburg', re: /hamburg|\bhh\b/i },
  { code: 'DE-HE', api: 'HE', name: 'Hessen', re: /hessen|frankfurt|darmstadt|kassel|\bhe\b/i },
  { code: 'DE-MV', api: 'MV', name: 'Mecklenburg-Vorpommern', re: /mecklenburg|rostock|schwerin|\bmv\b/i },
  { code: 'DE-NI', api: 'NI', name: 'Niedersachsen', re: /niedersachsen|hannover|braunschweig|\bni\b/i },
  { code: 'DE-NW', api: 'NW', name: 'Nordrhein-Westfalen', re: /nrw|nordrhein|köln|koeln|düsseldorf|duesseldorf|dortmund|essen|\bnw\b/i },
  { code: 'DE-RP', api: 'RP', name: 'Rheinland-Pfalz', re: /rheinland-pfalz|mainz|koblenz|\brp\b/i },
  { code: 'DE-SL', api: 'SL', name: 'Saarland', re: /saarland|saarbrücken|saarbruecken|\bsl\b/i },
  { code: 'DE-SN', api: 'SN', name: 'Sachsen', re: /\bsachsen\b|dresden|leipzig|\bsn\b/i },
  { code: 'DE-ST', api: 'ST', name: 'Sachsen-Anhalt', re: /sachsen-anhalt|magdeburg|halle|\bst\b/i },
  { code: 'DE-SH', api: 'SH', name: 'Schleswig-Holstein', re: /schleswig|kiel|lübeck|luebeck|\bsh\b/i },
  { code: 'DE-TH', api: 'TH', name: 'Thüringen', re: /thüringen|thueringen|erfurt|\bth\b/i },
]

export function landFromText(text: string): { code: string; api: string; name: string } | null {
  const t = text.trim()
  if (!t) return null
  for (const row of LANDS) {
    if (row.re.test(t)) return { code: row.code, api: row.api, name: row.name }
  }
  return null
}

export function landName(code: string): string {
  return LANDS.find((r) => r.code === code || r.api === code)?.name || code
}
