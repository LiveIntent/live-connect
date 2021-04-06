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
            <script src="http://bln.test.liveintent.com:3001/tracker.js" referrerpolicy="no-referrer-when-downgrade"></script>
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
            <script src="http://bln.test.liveintent.com:3001/tracker.js" referrerpolicy="no-referrer-when-downgrade"></script>
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
            <iframe id="iframe-id" name="iframe-name" src="http://bln.test.liveintent.com:3001/self-triggering-page" referrerpolicy="no-referrer-when-downgrade"></iframe>
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
            <iframe id="iframe-id" name="iframe-name" src="http://framed.test.liveintent.com:3001/framed" referrerpolicy="no-referrer-when-downgrade"></iframe>
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
