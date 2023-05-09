import * as core from '@actions/core'
import * as tc from '@actions/tool-cache'
import * as path from 'path'
import * as glob from 'glob'
import * as fs from 'fs'

export async function getVersionAndChangeset(): Promise<[string,string]> {
	let results = { version: core.getInput("version"), changeset: "" }

	if (!results.version) {
		console.log("'version' input was not provided, looking for version in 'ProjectSettings/ProjectVersion.txt' file...")
		if (tryGetVersionAndChangesetFromProjectSettings(results)) {
			console.log(`Found version ${results.version} ${results.changeset}`)
			return [results.version, results.changeset]
		} else {
			console.log("No project settings version detected.")
		}

		results.version = (await getAllReleaseVersionsFromWeb())[0]
		console.log(`Using latest stable release version ${results.version}.`)
	}

	if (!isVersionFullyQualified(results.version)) {
		console.log(`The provided Unity version is incomplete, searching for the latest version based off of '${results.version}'...`)
		results.version = await getFullVersionFromWeb(results.version)
		console.log(`Found latest version: ${results.version}.`)
	}

	results.changeset = await getChangeset(results.version)

	return [results.version, results.changeset]
}

function tryGetVersionAndChangesetFromProjectSettings(results: { version: string, changeset: string }): boolean {
	const workspace = process.env.GITHUB_WORKSPACE!
	if (!workspace) {
		return false
	}

	const searchPattern = path.join(workspace, "**", "ProjectSettings/ProjectVersion.txt")
	const files = glob.sync(searchPattern, { nodir: true })

	for (let i = 0; i < files.length; i++) {
		const fileContent = fs.readFileSync(files[i], "utf8")
		const match = fileContent.match(/m_EditorVersionWithRevision: (.+) \((.+)\)/)
		if (match) {
			results.version = match[1]
			results.changeset = match[2]

			return true
		}
	}
	return false
}

async function getAllReleaseVersionsFromWeb(): Promise<string[]> {
	const url = "https://unity.com/releases/editor/archive"
	const matcher = /(?<=unityhub:\/\/)\d+\.\d+\.\d+f?\d*/g
	return await getMatchesFromWebPage(url, matcher)
}

async function getMatchesFromWebPage(url: string, matcher: RegExp): Promise<string[]> {
	const downloadPath = await tc.downloadTool(url)
	const html = fs.readFileSync(downloadPath, 'utf8')
	const matches = html.match(matcher) || []

	return Array.from(matches)
}

function isVersionFullyQualified(version: string): boolean {
	const versionRegex = /^\d+\.\d+\.\d+[fab]?\d+$/;
	return versionRegex.test(version)
}

async function getFullVersionFromWeb(incompleteVersion: string): Promise<string> {
	const versions = await getAllReleaseVersionsFromWeb()
	const fullyQualifiedVersion = versions.find(version => version.includes(incompleteVersion))

	if (!fullyQualifiedVersion) {
		throw new Error(`Could not find the fully qualified version of '${incompleteVersion}'! Double check the desired version exists and note that providing incomplete alpha or beta versions is not supported.`)
	}

	return fullyQualifiedVersion
}

async function getChangeset(version: string): Promise<string> {
	let versionURL = `https://unity.com/releases/editor/whats-new/${version.replace('f1', '')}`

	if (version.includes('a')) {
		versionURL = `https://unity.com/releases/editor/alpha/${version}`
	} else if (version.includes('b')) {
		versionURL = `https://unity.com/releases/editor/beta/${version}`
	}

	const matches = await getMatchesFromWebPage(versionURL, new RegExp(`(?<=unityhub:\/\/${version}\/)[a-z0-9]+`))
	if (!matches || matches.length === 0) {
		throw new Error(`Could not find the changeset for version '${version}'`)
	}

	return matches[0]
}