//handle setupevents as quickly as possible
/*const setupEvents = require('./installers/setupEvents')
if (setupEvents.handleSquirrelEvent()) {
	// squirrel event handled and app will exit in 1000ms, so don't do anything else
	return;
}*/

const electron = require('electron'), // Main ElectronJS Object
			{dialog} = require('electron')
			app = electron.app, // Module to control application life.
			{ipcMain} = require('electron'), // Communicate between windows
			path = require('path'), // Parse the file path
			BrowserWindow = electron.BrowserWindow, // Module to create native browser window.
			dotenv = require('dotenv'),// Grab environment variables from .env file right away
			dotenvExpand = require('dotenv-expand'),
			myEnv = dotenv.config({path: path.join(__dirname, '.env')}),
			log = require('electron-log'),
			{autoUpdater} = require('electron-updater'),
			isDev = require('electron-is-dev');

			if (isDev) {
				log.info('Running in development');
			} else {
				log.info('Running in production');
			}

dotenvExpand(myEnv)

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
log.info(`DEV ENVIRONMENT = ${process.env.TODO_DEV}`);


// Adds the main Menu to our app
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let helpWindow
let manualUpdate = false

function createWindow () {
	// MainWindow Options
	let opts = {titleBarStyle: 'default',
		height: 800,
		width: (process.env.TODO_DEV) ? 1920 : 1281,
		minWidth: 1281,
		minHeight: 800,
		backgroundColor: '#f8f9fa',
		show: false,
		icon: path.join(__dirname, 'assets/icons/png/64x64.png')

	}

	// Create the browser window.
	mainWindow = new BrowserWindow(opts)
	// and load the index.html of the app.
	mainWindow.loadURL(`file://${__dirname}/index.html`)

	
	
	if (process.env.TODO_DEV){
		// Open the DevTools.
		process.env.NODE_ENV === 'development'
		process.env.DEVTRON_DEBUG_PATH = `file://${__dirname}../../../devtron/static/index.html`
		mainWindow.webContents.openDevTools()
		
	}

	// Show the mainwindow when it is loaded and ready to show
	mainWindow.once('ready-to-show', () => {
		// Load a custom menu
		require('./menu/mainmenu', mainWindow)
		mainWindow.webContents.on('crashed', (e) => { log.error(e) })
		mainWindow.on('unresponsive', (e) => { console.error(e) })
		// Load main window
		mainWindow.show()
	})

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null
	})

	helpWindow = new BrowserWindow({frame: false,
		width: 1024,
		height: 768,
		minWidth: 800,
		minHeight: 600,
		backgroundColor: '#f8f9fa',
		show: false,
		icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
		parent: mainWindow,
		modal: true
	})
	// Open the DevTools.
	// helpWindow.webContents.openDevTools()
	helpWindow.loadURL(`file://${__dirname}/windows/helpwindow.html`)

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
	log.info('sending to window')
	mainWindow.webContents.send('message', text);
}

app.on('ready', function () {
	if (process.env.TODO_DEV) {require('devtron').install()}
	autoUpdater.checkForUpdatesAndNotify()
	let interval = setInterval(() => {autoUpdater.checkForUpdatesAndNotify()},3600000)
	app.on('window-all-closed', () => {clearInterval(interval)})
})

autoUpdater.on('update-downloaded', (ev, info) => {
	// Ask user to update the app
	dialog.showMessageBox({
		type: 'question',
		buttons: ['Restart', 'Later'],
		defaultId: 0,
		message: 'A new version has been downloaded. \n\n' + app.getName() +' will now update!',
		detail: `Current Version: ${ev.version}\n\nRelease Notes:\n${ev.releaseNotes.replace(/<[^>]*>/g, '')}`
	}, response => {
		if (response === 0 && !process.env.TODO_DEV) {
			setTimeout(() => autoUpdater.quitAndInstall(), 1);
		} else {
			dialog.showMessageBox({
				type: 'info',
				button: [],
				defaultId: 0,
				message: `The ${ev.version} update will apply the next time you restart.`,
				detail: info
			}, response2 => {
				if (response2 === 0) {
					return
				}
			})
			return
		}
	});
})
autoUpdater.on('update-available', (ev, info) => {
	sendStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (ev, info) => {
	if (!manualUpdate) {
		sendStatusToWindow('Up to date');
	} else {
		dialog.showMessageBox({
			type: 'info',
			buttons: [],
			defaultId: 0,
			message: `No update is available at this time.`,
			detail: `Versions\n\nCurrent: v${app.getVersion()}\nUpdated: v${ev.version}\n\nRelease Notes:\n${ev.releaseNotes.replace(/<[^>]*>/g, '')}`
		}, () => {
			sendStatusToWindow('Up to date')
			manualUpdate = false
		})
		
	}
	
})
autoUpdater.on('error', (ev, err) => {
		sendStatusToWindow('Error in auto-updater.');
})
autoUpdater.on('download-progress', (ev, progressObj) => {
		sendStatusToWindow('Download in progress...');
})
autoUpdater.on('update-downloaded', (ev, info) => {
		sendStatusToWindow('Update downloaded');
})
autoUpdater.on('checking-for-update', (ev, info) => {
		sendStatusToWindow('Checking for updates...');
})


// Second window Event Listeners
ipcMain.on('open-second-window', (event, arg)=> {
		helpWindow.show()
})

ipcMain.on('close-second-window', (event, arg)=> {
		helpWindow.hide()
})

ipcMain.on('checkUpdatesNow', (event, arg) => {
	console.log('Checking for updates manually')
	manualUpdate = true
	autoUpdater.checkForUpdates()
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

process.on('uncaughtException', (error) => {log.error(error)})