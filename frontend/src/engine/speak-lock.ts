/** Chat-TTS und Navi-Cues dürfen nicht übereinanderliegen. */

let chatSpeaking = false

export function setChatSpeaking(on: boolean): void {
  chatSpeaking = on
}

export function isChatSpeaking(): boolean {
  return chatSpeaking
}
