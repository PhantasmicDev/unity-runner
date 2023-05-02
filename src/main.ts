import * as core from '@actions/core'
import * as exec from '@actions/exec'
import { getVersionAndChangeset } from './Utils/version-handler'
import { setupUnity } from './Utils/setup-unity'
import * as fs from 'fs'
import * as path from 'path'

async function run(): Promise<void> {
    try {
        let path1 = process.env.UNITY_PATH

        if (!path1) {
            const [version, changeset] = await getVersionAndChangeset()
            path1 = await setupUnity(version, changeset)
            process.env.UNITY_PATH = path1
        }

        const command = core.getInput("command")

        const licenseContent = process.env.UNITY_LICENSE

        if(!licenseContent) {
            throw new Error("No License")
        }

        const filePath = path.join(process.cwd(), "unity-license.x.ulf")

        fs.writeFileSync(filePath, licenseContent)

        exec.exec(`${path1} -batchmode -nographics -manualLicenseFile ${filePath} -logfile`)

    } catch (error) {
        if (error instanceof Error) core.setFailed(error.message)
    }
}

run()