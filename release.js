const fs = require('fs')
const inquirer = require('inquirer')
const semver = require('semver')
const pkg = require('./package.json')
const manifestChrome = require('./shells/chrome/manifest.json')
const manifestFirefox = require('./shells/firefox/manifest.json')

const curVersion = pkg.version

;(async () => {
  const { newVersion } = await inquirer.prompt([{
    type: 'input',
    name: 'newVersion',
    message: `Please provide a version (current: ${curVersion}):`,
  }])

  if (!semver.valid(newVersion)) {
    console.error(`Invalid version: ${newVersion}`)
    process.exit(1)
  }

  if (semver.lt(newVersion, curVersion)) {
    console.error(`New version (${newVersion}) cannot be lower than current version (${curVersion}).`)
    process.exit(1)
  }

  const { yes } = await inquirer.prompt([{
    name: 'yes',
    message: `Release ${newVersion}?`,
    type: 'confirm'
  }])

  if (yes) {
    const isBeta = newVersion.includes('beta')
    pkg.version = newVersion
    if (isBeta) {
      const [, baseVersion, betaVersion] = /(.*)-beta\.(\w+)/.exec(newVersion)
      manifestChrome.version = manifestFirefox.version = `${baseVersion}-${betaVersion}`
      manifestChrome.version_name = `${baseVersion}-${betaVersion}-chrome`
      manifestFirefox.version_name = `${baseVersion}-${betaVersion}-firefox`
    } else {
      manifestChrome.version = manifestFirefox.version = newVersion
      manifestChrome.version_name = `${newVersion}-chrome`
      manifestFirefox.version_name = `${newVersion}-firefox`
    }

    applyIcons(manifestChrome)
    applyIcons(manifestFirefox, '', false)

    fs.writeFileSync('./package.json', JSON.stringify(pkg, null, 2))
    fs.writeFileSync('./shells/chrome/manifest.json', JSON.stringify(manifestChrome, null, 2))
    fs.writeFileSync('./shells/firefox/manifest.json', JSON.stringify(manifestFirefox, null, 2))
  } else {
    process.exit(1)
  }
})()

function applyIcons (manifest, suffix = '', isChrome = true) {
  [16, 48, 128].forEach(size => {
    if (isChrome) {
      manifest.icons[size] = `/icons/${size}${suffix}.png`
    } else {
      manifest.icons[size] = `icons/${size}${suffix}.png`
    }
  })
}
