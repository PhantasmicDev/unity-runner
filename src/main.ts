import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { activateLicense } from './activate-license'
import { getUnityPath } from './setup-unity'

async function run(): Promise<void> {
    try {
        const unityPath = await getUnityPath()
        
        await activateLicense(unityPath)
        
        const command = core.getInput("command")
        const rawCommand = core.getBooleanInput("raw-command")

        if (rawCommand){
            await exec.exec(`${unityPath} ${rawCommand}`)
        } else {
            await exec.exec(`${unityPath} -batchmode -nographics ${command} -logFile -quit`)
        }

    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}

run()
