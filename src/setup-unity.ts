import * as os from 'os'
import * as cache from '@actions/cache'
import * as fs from 'fs'
import * as exec from '@actions/exec'
import { getVersionAndChangeset } from './version-helper'

export async function getUnityPath(): Promise<string> {
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

async function setupUnity(version: string, changeset: string): Promise<string> {
    const installationPath = `/home/runner/Unity/Hub/Editor/${version}`
    const cacheKey = `unity-${version}-${os.platform}`

    console.log("Attempting to retrieve Unity installation from cache...")
    const restoredCache = await cache.restoreCache([installationPath], cacheKey) != undefined
    if (!restoredCache) {
        console.log(`${cacheKey} has not being previously cached.`)
    }

    const path = `/home/runner/Unity/Hub/Editor/${version}/Editor/Unity`

    if (!fs.existsSync(path)) {
        await installUnity(version, changeset)
    }

    if (!restoredCache) {
        console.log("Caching Unity...")
        await cache.saveCache([installationPath], cacheKey)
    }

    return path
}

async function installUnity(version: string, changeset: string): Promise<void> {
	await installUnityHub()
	await executeUnityHub(`install --version ${version} --changeset ${changeset}`)
}

async function installUnityHub(): Promise<void> {
	await executeCommand(`sudo bash -c "echo \\"deb https://hub.unity3d.com/linux/repos/deb stable main\\" | tee /etc/apt/sources.list.d/unityhub.list"`)
	await executeCommand('sudo bash -c "wget -qO - https://hub.unity3d.com/linux/keys/public | gpg --dearmor -o /etc/apt/trusted.gpg.d/unityhub.gpg"')
	await executeCommand('sudo apt-get update')
	await executeCommand('sudo apt-get install -y xvfb unityhub')
}

async function executeUnityHub(command: string): Promise<string> {
	return await executeCommand(`xvfb-run --auto-servernum unityhub --headless ${command}`)
}

async function executeCommand(command: string): Promise<string> {
	let output = ''

	const execOptions = {
		listeners: {
			stdout: (buffer: { toString: () => string }) => {
				output += buffer.toString()
			}
		}
	}
	await exec.exec(command, [], execOptions)

	return output
}