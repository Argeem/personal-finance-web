import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

function saveFinanceDataPlugin(): Plugin {
  return {
    name: 'save-finance-data-plugin',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] || ''
        const isSaveEndpoint = url === '/__api/save-data' || url.endsWith('/__api/save-data')
        const isDataEndpoint = url === '/__api/data' || url.endsWith('/__api/data')
        const filePath = path.resolve(__dirname, 'src/data/financeData.json')

        if (isDataEndpoint) {
          if (req.method === 'GET') {
            try {
              if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, 'utf-8')
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate')
                res.statusCode = 200
                res.end(content)
                return
              } else {
                res.statusCode = 404
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(JSON.stringify({ error: 'financeData.json not found' }))
                return
              }
            } catch (err: any) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.end(JSON.stringify({ error: err.message }))
              return
            }
          } else {
            res.statusCode = 405
            res.end('Method Not Allowed')
            return
          }
        }

        if (isSaveEndpoint) {
          if (req.method === 'POST') {
            let body = ''
            req.on('data', chunk => {
              body += chunk
            })
            req.on('end', () => {
              try {
                const data = JSON.parse(body)
                const dir = path.dirname(filePath)
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true })
                }
                fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.statusCode = 200
                res.end(JSON.stringify({ success: true, message: 'บันทึกข้อมูลลง src/data/financeData.json สำเร็จ' }))
              } catch (err: any) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json; charset=utf-8')
                res.end(JSON.stringify({ success: false, error: err.message }))
              }
            })
            return
          } else {
            res.statusCode = 405
            res.end('Method Not Allowed')
            return
          }
        }

        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: process.env.VITE_BASE_PATH || (process.env.NODE_ENV === 'production' ? '/personal/finance/' : '/'),
  server: {
    watch: {
      ignored: ['**/src/data/financeData.json']
    }
  },
  plugins: [react(), saveFinanceDataPlugin()],
})

