import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { getVersionAndChangeset } from './version-handler'
import { setupUnity } from './setup-unity'
import { activateLicense } from './activate-license'
import * as fs from 'fs'

async function run(): Promise<void> {
    try {
        const unityPath = await getPathToUnity()
        
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

async function getPathToUnity() : Promise<string> {
    let unityPath = process.env.UNITY_PATH

    if (!unityPath) {
        const [version, changeset] = await getVersionAndChangeset()
        unityPath = await setupUnity(version, changeset)
        
        const envPath = process.env.GITHUB_ENV;

        if (envPath) {
            fs.appendFileSync(envPath, `UNITY_PATH=${unityPath}`);
        }
    }
    return unityPath
}

run()
