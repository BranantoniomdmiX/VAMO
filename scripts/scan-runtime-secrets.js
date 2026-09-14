const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const root = path.resolve(__dirname, '..')
process.chdir(root)

const envPath = path.join(root, '.env.local')
const secrets = []

function cleanValue(value) {
  let v = value.trim()
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1)
  }
  return v
}

if (fs.existsSync(envPath)) {
  const env = fs.readFileSync(envPath, 'utf8')

  for (const line of env.split(/\r?\n/)) {
    const trimmed = line.trim()

    if (!trimmed || trimmed.startsWith('#')) continue

    const idx = trimmed.indexOf('=')
    if (idx <= 0) continue

    const key = trimmed.slice(0, idx).trim()
    const value = cleanValue(trimmed.slice(idx + 1))

    if (
      !key.startsWith('NEXT_PUBLIC_') &&
      !key.includes('PUBLIC_KEY') &&
      value.length > 8
    ) {
      secrets.push({ key, value })
    }
  }
}

const trackedRaw = execFileSync(
  'git',
  ['ls-files', '-z'],
  { encoding: 'utf8' }
)

const trackedFiles = trackedRaw
  .split('\0')
  .filter(Boolean)

const privateKeyMarkers = [
  'BEGIN OPENSSH PRIVATE KEY',
  'BEGIN RSA PRIVATE KEY',
  'BEGIN EC PRIVATE KEY',
  'BEGIN PRIVATE KEY',
  'BEGIN PGP PRIVATE KEY BLOCK',
  'AGE-SECRET-KEY-'
]

const findings = []
let textFilesScanned = 0

for (const file of trackedFiles) {
  const fullPath = path.join(root, file)

  if (!fs.existsSync(fullPath)) continue

  const stat = fs.statSync(fullPath)
  if (!stat.isFile()) continue

  // Evita APKs, imágenes y binarios muy grandes.
  if (stat.size > 5 * 1024 * 1024) continue

  const buffer = fs.readFileSync(fullPath)

  // Archivo binario.
  if (buffer.includes(0)) continue

  const text = buffer.toString('utf8')
  textFilesScanned++

  for (const marker of privateKeyMarkers) {
    if (text.includes(marker)) {
      findings.push({
        type: 'PRIVATE_KEY_MATERIAL',
        file
      })
    }
  }

  for (const secret of secrets) {
    if (text.includes(secret.value)) {
      findings.push({
        type: 'ACTIVE_SECRET',
        key: secret.key,
        file
      })
    }
  }
}

console.log(`TRACKED_FILES=${trackedFiles.length}`)
console.log(`TEXT_FILES_SCANNED=${textFilesScanned}`)
console.log(`ACTIVE_SECRET_REFERENCES=${findings.length}`)

if (findings.length > 0) {
  console.log('SECRET_SCAN=FAIL')

  for (const finding of findings) {
    if (finding.type === 'ACTIVE_SECRET') {
      console.log(
        `FINDING=${finding.type} KEY=${finding.key} FILE=${finding.file}`
      )
    } else {
      console.log(
        `FINDING=${finding.type} FILE=${finding.file}`
      )
    }
  }

  process.exit(1)
}

console.log('PRIVATE_KEY_SCAN=NO_MATCHES')
console.log('ACTIVE_SECRET_SCAN=NO_MATCHES')
console.log('SECRET_SCAN=PASS')
