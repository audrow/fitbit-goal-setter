import { writeCSV, readCSVObjects } from "../deps.ts"
import type { intraDayStepsEntry } from "../fitbit-api/types.ts"

const mockSteps: { time: string, value: number }[] = [
  {time: '1', value: 0,},
  {time: '2', value: 1,},
  {time: '3', value: 2,},
  {time: '4', value: 3,},
  {time: '5', value: 4,},
  {time: '6', value: 5,},
  {time: '7', value: 6,},
  {time: '8', value: 7,},
  {time: '9', value: 8,},
  {time: '10', value: 9,},
  {time: '11', value: 10,},
  {time: '12', value: 11,},
  {time: '13', value: 12,},
  {time: '14', value: 13,},
  {time: '15', value: 14,},
  {time: '16', value: 15,},
  {time: '17', value: 16,},
  {time: '18', value: 17,},
  {time: '19', value: 18,},
  {time: '20', value: 19,},
]

const cachingDir = './data'
const cachingFile = 'caching.json'

await Deno.mkdir(cachingDir, { recursive: true })

export async function writeIntradayStepsToCsv(steps: { time: string, value: number }[], file: string) {
  const f = await Deno.open(file, { write: true })
  const header = ["time", "value"]
  const data = mockSteps.map(d => [d.time, d.value.toString()])
                        .map(d => Object.values(d))
  await writeCSV(f, [header, ...data])
  f.close()
}

export async function readIntradayStepsFromCsv(file: string) {
  const f = await Deno.open(file, { read: true })
  let data: intraDayStepsEntry[] = []
  for await (const obj of readCSVObjects(f)) {
    const time = obj.time
    const value = Number(obj.value)
    data.push({ time, value })
  }
  f.close()
  return data
}

const file = `${cachingDir}/${cachingFile}`
await writeIntradayStepsToCsv(mockSteps, file)
const data: intraDayStepsEntry[] = await readIntradayStepsFromCsv(file)
console.log(data)