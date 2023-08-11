import { readFileSync } from 'fs'
import { defineEventHandler } from 'h3'

const packageJSON = readFileSync('package.json', 'utf-8')

export default defineEventHandler(() => {
  return {
    version: JSON.parse(packageJSON).version,
  }
})
