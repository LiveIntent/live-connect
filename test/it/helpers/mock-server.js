import * as fs from 'fs'
import * as http from 'http'
import { assert } from 'chai'

const express = require('express')
const cors = require('cors')
const corsOptions = {
  origin: true,
  credentials: true
}
const port = 3001

const compression = require('compression')

const bundle = fs.readFileSync('dist/bundle.iife.js', 'utf8')

const pixelData = [
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00, 0x00, 0xFF, 0xFF, 0xFF,
  0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x04, 0x00, 0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
  0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
]

export function MockServerFactory (config) {
  const preamble = `window.LI=${JSON.stringify(config)};\n`
  const fullContent = preamble + bundle
  const app = express()
  app.use(compression())
  let history = []
  let idex = []
  app.get('/page', (req, res) => {
    res.send(
      `<!DOCTYPE html>
            <html lang="en">
            <head><title></title>
            </head>
            <body>
            <div id="before">Before</div>
            <script src="http://bln.test.liveintent.com:3001/tracker.js"></script>
            <div id="after">After</div>
            <div id="idex">None</div>
            </body>
            </html>`
    )
  })

  app.get('/self-triggering-page', (req, res) => {
    res.send(
      `<!DOCTYPE html>
            <html lang="en">
            <head><title></title>
            </head>
            <body>
            <div id="before">Before</div>
            <script src="http://bln.test.liveintent.com:3001/tracker.js"></script>
            <script>
               liQ.push({just: 'dance'})
            </script>
            <div id="after">After</div>
            <div id="idex">None</div>
            </body>
            </html>`
    )
  })

  app.options('/idex/unknown/any', cors(corsOptions))
  app.get('/idex/unknown/any', cors(corsOptions), (req, res) => {
    console.log(`IDEX :: Received request '${JSON.stringify(req.query)}'. Referer: ${req.get('Referer')}. Origin: ${req.get('Origin')}`)
    idex.push(req)
    res.json({ unifiedId: 'some-id' })
  })

  app.get('/framed', (req, res) => {
    res.send(
      `<!DOCTYPE html>
            <html lang="en">
            <head><title></title>
            </head>
            <body>
            <div id="before">Before</div>
            <iframe id="iframe-id" name="iframe-name" src="http://bln.test.liveintent.com:3001/self-triggering-page"></iframe>
            <div id="after">After</div>
            </body>
            </html>`
    )
  })

  app.get('/double-framed', (req, res) => {
    res.send(
      `<!DOCTYPE html>
            <html lang="en">
            <head><title></title>
            </head>
            <body>
            <div id="before">Before</div>
            <iframe id="iframe-id" name="iframe-name" src="http://framed.test.liveintent.com:3001/framed"></iframe>
            <div id="after">After</div>
            </body>
            </html>`
    )
  })

  app.get('/referrer', (req, res) => {
    res.send(
      `<!DOCTYPE html>
            <html lang="en">
            <head><title></title>
            </head>
            <body>
            <div id="referrer-before">Before</div>
            <a href="${req.query.uri}" id="page" target="_self">Page</a>
            <div id="referrer-after">After</div>
            </body>
            </html>`
    )
  })

  app.get('/tracker.js', (req, res) => {
    res.send(fullContent)
    console.log('Returned data')
  })

  app.get('/p', (req, res) => {
    console.log(`PIXEL :: Received request '${JSON.stringify(req.query)}'. Referer: ${req.get('Referer')}. Origin: ${req.get('Origin')}`)
    history.push(req)

    res.writeHead(200, {
      'Content-Type': 'image/gif',
      'Content-Length': pixelData.length
    })
    res.end(Buffer.from(pixelData))
  })

  app.get('/favicon.ico', (req, res) => {
    res.sendStatus(200)
  })

  const server = http.createServer(app)

  server.listen(port, function () {
    console.log(`App is listening on port ${port}`)
  })

  return {
    openPage: (domain, page) => {
      browser.url(`http://${domain}:3001/${page}`)
      const before = $('#before').getText()
      assert.strictEqual(before, 'Before')
      const after = $('#after').getText()
      assert.strictEqual(after, 'After')
    },
    openUriViaReferrer: (referrerDomain, pageDomain, page) => {
      browser.url(`http://${referrerDomain}:3001/referrer?uri=http://${pageDomain}:3001/${page}`)
      const before = $('#referrer-before').getText()
      assert.strictEqual(before, 'Before')
      const after = $('#referrer-after').getText()
      assert.strictEqual(after, 'After')
      $('#page').click()
      const beforePage = $('#before').getText()
      assert.strictEqual(beforePage, 'Before')
      const afterPage = $('#after').getText()
      assert.strictEqual(afterPage, 'After')
    },
    getHistory: () => {
      return history
    },
    getIdexHistory: () => {
      return idex
    },
    getTrackingRequests: () => {
      return history.filter(req => req.query.ae === undefined)
    },
    getApplicationErrors: () => {
      return history.filter(req => req.query.ae !== undefined)
    },
    clearHistory: () => {
      idex = []
      history = []
    },
    stop: () => {
      server.close()
    }
  }
}
