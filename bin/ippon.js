#!/usr/bin/env node
import { main } from '../dist/cli.js'

main(process.argv.slice(2)).catch((e) => {
  console.error(`✗ ${e.message}`)
  process.exit(1)
})
