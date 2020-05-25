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

export function MockServerFactory (config) {
  const preamble = `window.LI=${JSON.stringify(config)};\n`
  const fullContent =  preamble + bundle
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

  app.options('/idex/unknown/any', cors(corsOptions))
  app.get('/idex/unknown/any', cors(corsOptions), (req, res) => {
    console.log(`IDEX :: Received request '${JSON.stringify(req.query)}'`)
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
            <iframe id="iframe-id" name="iframe-name" src="http://bln.test.liveintent.com:3001/page"></iframe>
            <div id="after">After</div>
            </body>
            </html>`
    )
  })

  app.get('/tracker.js', (req, res) => {
    res.send(fullContent)
    console.log('Returned data')
  })

  app.get('/p', (req, res) => {
    console.log(`PIXEL :: Received request '${JSON.stringify(req.query)}'`)
    history.push(req)
    res.sendStatus(200)
  })

  app.get('/favicon.ico', (req, res) => {
    res.sendStatus(200)
  })

  const server = http.createServer(app)

  server.listen(port, function () {
    console.log(`App is listening on port ${port}`)
  })

  return {
    openPage: (uri, page) => {
      browser.url(`http://${uri}:3001/${page}`)
      const before = $('#before').getText()
      assert.strictEqual(before, 'Before')
      const after = $('#after').getText()
      assert.strictEqual(after, 'After')
    },
    getHistory: () => {
      return history
    },
    getIdexHistory: () => {
      return idex
    },
    getTrackingRequests: () => {
      return history.filter(req => req['query']['ae'] === undefined)
    },
    getApplicationErrors: () => {
      return history.filter(req => req['query']['ae'] !== undefined)
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
