declare module 'qrcode' {
  export type QRCode = {
    version: number
    modules: { size: number; get(row: number, col: number): boolean }
  }
  function create(text: string, opts?: { errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H' }): QRCode
  export default { create }
}
