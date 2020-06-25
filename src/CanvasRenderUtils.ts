import { CanvasRenderingContext2D, createCanvas, registerFont } from 'canvas'
import { createWriteStream } from 'fs'
import { resolve } from 'path'

registerFont(resolve(__dirname, './fonts/Roboto_Condensed/RobotoCondensed-Bold.ttf'), { family: 'RobotoCondensed700' })
registerFont(resolve(__dirname, './fonts/Roboto_Condensed/RobotoCondensed-Regular.ttf'), { family: 'RobotoCondensed400' })
registerFont(resolve(__dirname, './fonts/Roboto/Roboto-Bold.ttf'), { family: 'Roboto700' })
registerFont(resolve(__dirname, './fonts/Roboto/Roboto-Medium.ttf'), { family: 'Roboto500' })
registerFont(resolve(__dirname, './fonts/Roboto/Roboto-Regular.ttf'), { family: 'Roboto400' })
registerFont(resolve(__dirname, './fonts/Open_Sans/OpenSans-Regular.ttf'), { family: 'OpenSans400' })
registerFont(resolve(__dirname, './fonts/Open_Sans/OpenSans-SemiBold.ttf'), { family: 'OpenSans600' })
registerFont(resolve(__dirname, './fonts/Open_Sans/OpenSans-Bold.ttf'), { family: 'OpenSans700' })

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

export function getContext(w: number, h: number, rotate: boolean = false) {
  const ctx = getDefaultContext(w, h)
  if (rotate) {
    ctx.translate(0, h)
    ctx.rotate(-90 * Math.PI / 180)
  }
  return ctx
}

export function renderCenteredText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  ctx.fillText(text, x - getTextCenter(ctx, text).x, y)
}

export function renderRightAdjustedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number) {
  const t = ctx.measureText(text)
  ctx.fillText(text, x - t.width, y)
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

export function to8BitGrayScale(data: ImageData) {
  const grayScaleImage = Buffer.alloc(data.width * data.height)

  for (let i = 0; i < data.height * data.width * 4; i += 4) {
    grayScaleImage[i / 4] = Math.round((data.data[i] + data.data[i + 1] + data.data[i + 2]) / 3)
  }

  return grayScaleImage
}

export function toTwoBitGrayScale(data: ImageData) {
  const grayScale = to8BitGrayScale(data)
  const twoBitGrayScale = Buffer.alloc(data.width * data.height * 2 / 8)

  for (let i = 0; i < grayScale.length; i += 4) {
    let twoBitImageByte = 0

    for (let j = 0; j < 4; j++) {
      if (grayScale[i + j] > 192) {
        // Pixel is white
        twoBitImageByte += 3
      } else if (grayScale[i + j] > 128) {
        // Pixel is light gray
        twoBitImageByte += 2
      } else if (grayScale[i + j] > 64) {
        // Pixel is dark gray
        twoBitImageByte += 1
      }

      if(j < 3) {
        twoBitImageByte = twoBitImageByte << 2
      }
    }

    twoBitGrayScale[i / 4] = twoBitImageByte
  }

  return twoBitGrayScale
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
