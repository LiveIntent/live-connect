import * as fs from 'fs'
import * as http from 'http'
import { assert } from 'chai'
import { WAIT_UNTIL_TIMEOUT_MILLIS, WAIT_UNTIL_INTERVAL } from './browser'

const express = require('express')
const cors = require('cors')
const corsOptions = {
  origin: true,
  credentials: true
}
const port = 3001

const compression = require('compression')

const bundle = fs.readFileSync('dist/bundle.iife.js', 'utf8')

async function getText (selector) {
  return $(selector).then(e => e.getText())
}

async function click (selector) {
  return $(selector).then(e => e.click())
}

export function MockServerFactory (config) {
  const preamble = `window.LI=${JSON.stringify(config)};\n`
  const fullContent = preamble + bundle
  const app = express()
  app.use(compression(), cors(corsOptions))
  let history = []
  let idex = []
  let bakerHistory = []
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
            <a href="${req.query.uri}" id="page" target="_self" referrerpolicy="no-referrer-when-downgrade">Page</a>
            <div id="referrer-after">After</div>
            </body>
            </html>`
    )
  })

  app.get('/elements', (req, res) => {
    res.send(
      `<!DOCTYPE html>
            <html lang="en">
            <head><title></title>
            </head>
            <body>
            <p>To collect</p>
            <div id="before">Before</div>
            <script src="http://bln.test.liveintent.com:3001/tracker.js"></script>
            <div id="after">After</div>
            <div id="idex">None</div>
            </body>
            </html>`
    )
  })

  app.get('/tracker.js', (req, res) => {
    res.send(fullContent)
    console.log('Returned data')
  })

  app.get('/p', (req, res) => {
    console.log(`P PIXEL :: Received request '${JSON.stringify(req.query)}'. Referer: ${req.get('Referer')}. Origin: ${req.get('Origin')}`)
    history.push(req)
    res.sendStatus(200)
  })

  app.get('/j', (req, res) => {
    console.log(`J PIXEL :: Received request '${JSON.stringify(req.query)}'. Referer: ${req.get('Referer')}. Origin: ${req.get('Origin')}`)
    history.push(req)
    if (req.query.pu.includes('baked.liveintent.com')) {
      res.status(200).json({
        bakers: ['http://baked.liveintent.com:3001/baker', 'http://bln.test.liveintent.com:3001/baker']
      })
    } else {
      res.status(200).json({})
    }
  })

  app.get('/baker', (req, res) => {
    console.log(`BAKER :: Received request '${JSON.stringify(req.query)}'. Referer: ${req.get('Referer')}. Origin: ${req.get('Origin')}`)
    bakerHistory.push(req)
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
    openPage: async (domain, page) => {
      await browser.url(`http://${domain}:3001/${page}`)

      const before = await getText('#before')
      assert.strictEqual(before, 'Before')

      const after = await getText('#after')
      assert.strictEqual(after, 'After')
    },
    openUriViaReferrer: async (referrerDomain, pageDomain, page) => {
      await browser.url(`http://${referrerDomain}:3001/referrer?uri=http://${pageDomain}:3001/${page}`)

      const before = await getText('#referrer-before')
      assert.strictEqual(before, 'Before')

      const after = await getText('#referrer-after')
      assert.strictEqual(after, 'After')

      await click('#page')

      await browser.waitUntil(async () => {
        const beforePage = await $('#before')
        const afterPage = await $('#after')
        if (beforePage.elementId && afterPage.elementId) {
          const beforePageText = await beforePage.getText()
          const afterPageText = await afterPage.getText()
          return beforePageText === 'Before' && afterPageText === 'After'
        } else {
          return false
        }
      }, WAIT_UNTIL_TIMEOUT_MILLIS, 'opening page timed out', WAIT_UNTIL_INTERVAL)
    },
    getHistory: () => {
      return history
    },
    getIdexHistory: () => {
      return idex
    },
    getBakerHistory: () => {
      return bakerHistory
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
      bakerHistory = []
    },
    stop: () => {
      server.close()
    }
  }
}
