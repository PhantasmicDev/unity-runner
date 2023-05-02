import * as core from '@actions/core'

async function run(): Promise<void> {
    const nameToGreet = core.getInput("name-to-greet")
    console.log(`Hello ${nameToGreet}!`)
} 

run()