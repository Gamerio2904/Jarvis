const EYE =
  /^\s*(?:lies\s+das\s+foto|was\s+steht\s+auf\s+dem\s+zettel|schau\s+(?:mal\s+)?das\s+bild|auge|foto\s+lesen|knips(?:e)?(?:\s+mal)?|kamera|was\s+(?:siehst|steht)\s+(?:du\s+)?(?:auf\s+dem\s+bild|auf\s+dem\s+foto)|was\s+ist\s+auf\s+dem\s+(?:bild|foto)|mach\s+ein\s+foto)\s*[.?!]?\s*$/i

export function parseEyeIntent(text: string): boolean {
  return EYE.test(text.trim())
}
