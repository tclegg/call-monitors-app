// Grab environment variables from .env file right away

const dotenv = require('dotenv'),
      dotenvExpand = require('dotenv-expand'),
      myEnv = dotenv.config(),
      log = require('electron-log'),
      {autoUpdater} = require('electron-updater');

dotenvExpand(myEnv)

//handle setupevents as quickly as possible
const setupEvents = require('./installers/setupEvents')
if (setupEvents.handleSquirrelEvent()) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}

const electron = require('electron'), // Main ElectronJS Object
      isDev = process.env.TODO_DEV ? (process.env.TODO_DEV.trim() == "true") : false, // Check for Dev variable
      app = electron.app, // Module to control application life.
      {ipcMain} = require('electron'), // Communicate between windows
      path = require('path'), // Parse the file path
      BrowserWindow = electron.BrowserWindow // Module to create native browser window.



//const autoUpdater = require("electron-updater").autoUpdater

//-------------------------------------------------------------------
// Logging
//
// THIS SECTION IS NOT REQUIRED
//
// This logging setup is not required for auto-updates to work,
// but it sure makes debugging easier :)
//-------------------------------------------------------------------
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
log.transports.file.format = '{h}:{i}:{s}:{ms} {text}';
log.transports.file.maxSize = 5*1024*1024;
log.transports.file.file = path.join(__dirname, 'log.txt');
log.transports.file.appName = app.getName()

log.info('App starting...');
log.info(`DEV ENVIRONMENT = ${isDev}`);


// Adds the main Menu to our app
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let secondWindow

function createWindow () {
  // MainWindow Options
  let opts = {titleBarStyle: 'hidden',
    height: 800,
    minWidth: 1281,
    minHeight: 800,
    backgroundColor: '#8c0c03',
    show: false,
    icon: path.join(__dirname, 'assets/icons/png/64x64.png')
  }
  opts.width = (isDev) ? 1920 : 1281
  // Create the browser window.
  mainWindow = new BrowserWindow(opts)

  // and load the index.html of the app.
  mainWindow.loadURL(`file://${__dirname}/index.html`)

	
  
	if (isDev){
    // Open the DevTools.
    mainWindow.webContents.openDevTools()
	}

  // Show the mainwindow when it is loaded and ready to show
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  secondWindow = new BrowserWindow({frame: false,
    width: 1024,
    height: 768,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#8c0c03',
    show: false,
    icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
    parent: mainWindow
  })
	// Open the DevTools.
	// secondWindow.webContents.openDevTools()
  secondWindow.loadURL(`file://${__dirname}/windows/ipcwindow.html`)

  // Load the menu
  require('./menu/mainmenu')
}


//-------------------------------------------------------------------
// Auto updates
//
// For details about these events, see the Wiki:
// https://github.com/electron-userland/electron-builder/wiki/Auto-Update#events
//
// The app doesn't need to listen to any events except `update-downloaded`
//
// Uncomment any of the below events to listen for them.  Also,
// look in the previous section to see them being used.
//-------------------------------------------------------------------
// autoUpdater.on('checking-for-update', () => {
// })
// autoUpdater.on('update-available', (ev, info) => {
// })
// autoUpdater.on('update-not-available', (ev, info) => {
// })
// autoUpdater.on('error', (ev, err) => {
// })
// autoUpdater.on('download-progress', (ev, progressObj) => {
// })

function sendStatusToWindow(text) {
  log.info(text);
  mainWindow.webContents.send('message', text);
}
app.on('ready', function () {
  log.info('app ready and should be checking for updates')
  autoUpdater.checkForUpdatesAndNotify()
})

autoUpdater.on('update-downloaded', (ev, info) => {
  setTimeout(function() {
    autoUpdater.quitAndInstall();
  }, 5000)
})
autoUpdater.on('update-available', (ev, info) => {
  sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (ev, info) => {
  sendStatusToWindow('Update not available.');
})
autoUpdater.on('error', (ev, err) => {
  sendStatusToWindow('Error in auto-updater.');
})
autoUpdater.on('download-progress', (ev, progressObj) => {
  sendStatusToWindow('Download progress...');
})
autoUpdater.on('update-downloaded', (ev, info) => {
  sendStatusToWindow('Update downloaded; will install in 5 seconds');
})
autoUpdater.on('checking-for-update', () => {
  log.info('---checking for update---')
  sendStatusToWindow('Checking for update...');
})


// Second window Event Listeners
ipcMain.on('open-second-window', (event, arg)=> {
    secondWindow.show()
})

ipcMain.on('close-second-window', (event, arg)=> {
    secondWindow.hide()
})


// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})




// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
