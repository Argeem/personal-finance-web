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
      server.middlewares.use('/__api/save-data', (req, res) => {
        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => {
            body += chunk
          })
          req.on('end', () => {
            try {
              const data = JSON.parse(body)
              const filePath = path.resolve(__dirname, 'src/data/financeData.json')
              fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.statusCode = 200
              res.end(JSON.stringify({ success: true, message: 'บันทึกข้อมูลลง src/data/financeData.json สำเร็จ' }))
            } catch (err: any) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          })
        } else {
          res.statusCode = 405
          res.end('Method Not Allowed')
        }
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), saveFinanceDataPlugin()],
})

