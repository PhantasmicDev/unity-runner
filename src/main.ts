import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { getVersionAndChangeset } from './Utils/version-handler'
import { setupUnity } from './Utils/setup-unity'

async function run(): Promise<void> {
    try {
        let path = process.env.UNITY_PATH

        if (!path) {
            const [version, changeset] = await getVersionAndChangeset()
            path = await setupUnity(version, changeset)
            process.env.UNITY_PATH = path
        }

        const command = core.getInput("command")
        exec.exec(`${path} ${command} -batchmode -nographics -username ${process.env.UNITY_USERNAME} -password ${process.env.UNITY_PASSWORD} -quit`)

    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}

run()