import * as os from 'os'
import * as fs from 'fs'
import * as exec from '@actions/exec'
import * as path from 'path'

export async function activateLicense(unityPath: string): Promise<void> {
    if (hasActiveLicense()) {
        return
    }

    const licenseContent = process.env.UNITY_LICENSE

    if (!licenseContent){
        return
    }

    const licenseFilePath = createLicenseFile(licenseContent)
    
    console.log("Activating license...")
    await exec.exec(`${unityPath} -batchmode -manualLicenseFile ${licenseFilePath} -logfile`)
}

function hasActiveLicense(): boolean {
    const licenseFilePath = `${os.homedir()}/.local/share/unity3d/Unity/Unity_lic.ulf`;
    return fs.existsSync(licenseFilePath)
}

async function createLicenseFile(licenseContent: string): Promise<string> {
    const tempFolder = process.env.RUNNER_TEMP || os.tmpdir()

    const filePath = path.join(tempFolder, 'license.ulf')
    fs.writeFileSync(filePath, licenseContent)
    return filePath
}