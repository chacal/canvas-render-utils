import { CanvasRenderingContext2D, createCanvas } from 'canvas'
import { createWriteStream } from 'fs'

export function getTextCenter(ctx: CanvasRenderingContext2D, text: string) {
  const t = ctx.measureText(text)
  return {
    x: t.width / 2,
    y: t.actualBoundingBoxAscent / 2
  }
}

export function getDefaultContext(width: number, height: number) {
  const canvas = createCanvas(width, height)
  const ctx = canvas.getContext('2d')
  ctx.antialias = 'none'

  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#000000'

  return ctx
}

export function toBinaryImage(data: ImageData) {
  const binaryImage = Buffer.alloc(data.width * data.height / 8)

  // Loop in 8 pixel (= 32 byte) blocks
  for (let i = 0; i < data.height * data.width * 4; i += 32) {
    let binaryImageByte = 0

    // Loop pixels (= 4 byte blocks) in the 8 pixel block
    for (let j = 0; j < 32; j += 4) {
      if (data.data[i + j] < 150 || data.data[i + j + 1] < 150 || data.data[i + j + 2] < 150) {
        // Pixel has some other color than white -> interpret as black -> set corresponding bit to 1 in binaryImageByte
        binaryImageByte += 1
      }
      // Shift left if not handling the last pixel
      if (j < 28) {
        binaryImageByte = binaryImageByte << 1
      }
    }

    binaryImage[i / 32] = binaryImageByte
  }

  return binaryImage
}

export function saveToPngFile(data: ImageData, pngFileName: string): Promise<void> {
  const canvas = createCanvas(data.width, data.height)
  const ctx = canvas.getContext('2d')
  ctx.putImageData(data, 0, 0)

  const stream = canvas.createPNGStream()
  const pngOut = createWriteStream(pngFileName)
  stream.pipe(pngOut)
  return new Promise(resolve => {
    pngOut.on('finish', () => resolve())
  })
}
