const createWindowsInstaller = require('electron-winstaller').createWindowsInstaller
const path = require('path')

getInstallerConfig()
  .then(createWindowsInstaller)
  .catch((error) => {
    console.error(error.message || error)
    process.exit(1)
  })

function getInstallerConfig () {
  console.log('creating windows installer')
  const rootPath = path.join('./')
  const outPath = path.join(rootPath, 'release-builds')

  return Promise.resolve({
    appDirectory: path.join(outPath, 'Call-Monitors-App-win32-ia32/'),
    authors: 'Thomas Clegg',
    noMsi: true,
    outputDirectory: path.join(outPath, 'windows-installer'),
    exe: 'Call-Monitors-App.exe',
    setupExe: 'CallMonitorsAppInstaller.exe',
    setupIcon: path.join(rootPath, 'assets', 'icons', 'win', 'icon.png')
  })
}
