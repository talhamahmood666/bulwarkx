import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..')
const srcDir = path.join(root, 'src')
const distDir = path.join(root, 'dist')

fs.rmSync(distDir, { recursive: true, force: true })
fs.mkdirSync(distDir, { recursive: true })

function copyDir(from, to) {
  const entries = fs.readdirSync(from, { withFileTypes: true })
  fs.mkdirSync(to, { recursive: true })
  for (const entry of entries) {
    const fromPath = path.join(from, entry.name)
    const toPath = path.join(to, entry.name)
    if (entry.isDirectory()) {
      copyDir(fromPath, toPath)
    } else if (entry.isFile()) {
      fs.copyFileSync(fromPath, toPath)
    }
  }
}

copyDir(srcDir, distDir)

const readmeSrc = path.join(root, 'README.md')
if (fs.existsSync(readmeSrc)) {
  fs.copyFileSync(readmeSrc, path.join(distDir, 'README.md'))
}
