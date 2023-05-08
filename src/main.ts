import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { getVersionAndChangeset } from './Utils/version-handler'
import { setupUnity } from './Utils/setup-unity'
import * as fs from 'fs'

async function run(): Promise<void> {
    try {
        let unityPath = process.env.UNITY_PATH

        if (!unityPath) {
            const [version, changeset] = await getVersionAndChangeset()
            unityPath = await setupUnity(version, changeset)
            
            const envPath = process.env.GITHUB_ENV;

            if (envPath) {
                fs.appendFileSync(envPath, `UNITY_PATH=${unityPath}`);
            }
        }

        const command = core.getInput("command")

        //await exec.exec(`${unityPath} -batchmode -manualLicenseFile Unity_v2022.x.ulf -logfile`)

        await exec.exec(`${unityPath} ${command}`)
        console.log("Unity Command Done")

    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}

run()
