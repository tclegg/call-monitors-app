'use strict';

//handle setupevents as quickly as possible
/*const setupEvents = require('./installers/setupEvents')
if (setupEvents.handleSquirrelEvent()) {
	// squirrel event handled and app will exit in 1000ms, so don't do anything else
	return;
}*/


const {electron, app, ipcMain, dialog, shell, BrowserWindow} = require('electron')
			// Main ElectronJS Object
			// app = Module to control application life.
			// ipcMain = Communicate between windows
			// dialog = Send notifications using Windows Dialog Boxes
			// shell = Used to print to PDF
			// BrowserWindow = Module to create native browser window

	

const fs = require('fs'), 
			os = require('os'),
			path = require('path'), // Parse the file path
			dotenv = require('dotenv'),// Grab environment variables from .env file right away
			dotenvExpand = require('dotenv-expand'),
			myEnv = dotenv.config({path: path.join(__dirname, '.env')}),
			log = require('electron-log'),
			{autoUpdater} = require('electron-updater'),
			isDev = require('electron-is-dev'),
			appConfig = require('electron-settings');

			if (isDev) {
				console.info('Running in development');
			} else {
				console.info('Running in production');
			}

dotenvExpand(myEnv)
appConfig.setPath(path.join(__dirname, 'appsettings.json'))


//-------------------------------------------------------------------
// Save the state of the window to resume on reload
//-------------------------------------------------------------------
function windowStateKeeper(windowName) {
  let window, windowState;
  function setBounds() {
    // Restore from appConfig
    if (appConfig.has(`windowState.${windowName}`)) {
      windowState = appConfig.get(`windowState.${windowName}`);
      return;
    }
    // Default
    windowState = {
      x: undefined,
      y: undefined,
      width: (windowName === 'mainWindow') ? 1281 : 1024,
      height: (windowName === 'mainWindow') ? 800 : 768,
    };
  }
  function saveState() {
    if (!windowState.isMaximized) {
      windowState = window.getBounds();
    }
    windowState.isMaximized = window.isMaximized();
    appConfig.set(`windowState.${windowName}`, windowState);
  }
  function track(win) {
    window = win;
    ['resize', 'move', 'close'].forEach(event => {
      win.on(event, saveState);
    });
  }
  setBounds();
  return({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    isMaximized: windowState.isMaximized,
    track,
  });
}





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
log.transports.file.format = '[{y}-{m}-{d}]  [{h}:{i}:{s}:{ms}]  | [{level}] |  {text}';
log.transports.file.maxSize = 5*1024*1024;
log.transports.file.file = path.join(__dirname, 'log.txt');
log.transports.file.appName = app.getName()
log.info('App starting...');
log.info(`DEV ENVIRONMENT = ${process.env.TODO_DEV}, ${isDev}`);


// Adds the main Menu to our app
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow
let helpWindow
let logWindow
let manualUpdate = false

function createWindow () {
	// MainWindow Options
	const mainWindowStateKeeper = windowStateKeeper('mainWindow'),
				helpWindowStateKeeper = windowStateKeeper('helpWindow'),
				logWindowStateKeeper = windowStateKeeper('logWindow');


	let opts = {titleBarStyle: 'default',
		title: 'Main Window',
		x: mainWindowStateKeeper.x,
		y: mainWindowStateKeeper.y,
		height: mainWindowStateKeeper.height,
		width: (process.env.TODO_DEV) ? 1800 : mainWindowStateKeeper.width,//1281,
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
		mainWindow.focus()
	})

	// Emitted when the window is closed.
	mainWindow.on('closed', function () {
		// Dereference the window object, usually you would store windows
		// in an array if your app supports multi windows, this is the time
		// when you should delete the corresponding element.
		mainWindow = null
	})

	helpWindow = new BrowserWindow({frame: false,
		title: 'Help Window',
		width: helpWindowStateKeeper.width,
		height: helpWindowStateKeeper.height,
		minWidth: helpWindowStateKeeper.width,
		minHeight: helpWindowStateKeeper.height,
		backgroundColor: '#f8f9fa',
		show: false,
		icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
		parent: mainWindow,
		modal: true
	})
	// Open the DevTools.
	// helpWindow.webContents.openDevTools()
	helpWindow.loadURL(`file://${__dirname}/windows/helpwindow.html`)

	logWindow = new BrowserWindow({frame: false,
		title: 'Log Window',
		width: logWindowStateKeeper.width,
		height: logWindowStateKeeper.height,
		minWidth: logWindowStateKeeper.width,
		minHeight: logWindowStateKeeper.height,
		backgroundColor: '#f8f9fa',
		show: false,
		icon: path.join(__dirname, 'assets/icons/png/64x64.png'),
		parent: mainWindow,
		modal: true
	})
	
	logWindow.loadURL(`file://${__dirname}/windows/logwindow.html`)
	
	/*logWindow.once('ready-to-show', () => {
		sendLogsToWindow()
	})*/

	logWindow.webContents.on('did-finish-load', (e) => {
		sendLogsToWindow()
	})

	//Track window size/position in production
	if (!process.env.TODO_DEV){
		mainWindowStateKeeper.track(mainWindow)
		helpWindowStateKeeper.track(helpWindow)
		logWindowStateKeeper.track(logWindow)
	}
	
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

function sendUpdateStatusToWindow(text) {
	log.info(text);
	log.info('sending to window')
	mainWindow.webContents.send('updateMessage', text);
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
	sendUpdateStatusToWindow('Update available.');
})
autoUpdater.on('update-not-available', (ev, info) => {
	if (!manualUpdate) {
		sendUpdateStatusToWindow('Up to date');
	} else {
		dialog.showMessageBox({
			type: 'info',
			buttons: [],
			defaultId: 0,
			message: `No update is available at this time.`,
			detail: `Versions\n\nCurrently Installed: v${app.getVersion()}\nLatest Available: v${ev.version}\n\nRelease Notes:\n${ev.releaseNotes.replace(/<[^>]*>/g, '')}`
		}, () => {
			sendUpdateStatusToWindow('Up to date')
			manualUpdate = false
		})
		
	}
	
})
autoUpdater.on('error', (ev, err) => {
		sendUpdateStatusToWindow('Error in auto-updater.');
})
autoUpdater.on('download-progress', (ev, progressObj) => {
		sendUpdateStatusToWindow('Download in progress...');
})
autoUpdater.on('update-downloaded', (ev, info) => {
		sendUpdateStatusToWindow('Update downloaded');
})
autoUpdater.on('checking-for-update', (ev, info) => {
		sendUpdateStatusToWindow('Checking for updates...');
})


// Second window Event Listeners
ipcMain.on('open-second-window', (event, arg)=> {
		helpWindow.show()
})

ipcMain.on('close-second-window', (event, arg)=> {
		helpWindow.hide()
})

ipcMain.on('checkUpdatesNow', (event, arg) => {
	log.info('Checking for updates manually')
	manualUpdate = true
	autoUpdater.checkForUpdates()
})

function sendLogsToWindow() {
	log.info('sending to window')
	let logData = fs.readFileSync(path.join(__dirname, 'log.txt'))
	logWindow.webContents.send('logs', logData.toString());
}

// Listen for message from BrowserWindow
ipcMain.on('checkLogs', (event, arg) => {
	sendLogsToWindow()
	logWindow.show()
	
})

// Log window Event Listeners
//ipcMain.on('open-log-window', (event, arg)=> {
//	helpWindow.show()
//})

ipcMain.on('close-log-window', (event, arg)=> {
	logWindow.hide()
})

ipcMain.on('clear-logs', (event, arg) => {
	fs.writeFile(path.join(__dirname, 'log.txt'), '', (err) => {
		let message = 'The logs have been cleared'
		if (err) {
			message = err;
			return console.error(err.message)
		};
		
		logWindow.webContents.send('logs-cleared', message)
	})
})

ipcMain.on('print-to-pdf', (event) => {
	const pdfPath = path.join(os.tmpdir(), 'print.pdf')
	const win = BrowserWindow.fromWebContents(event.sender);

	win.webContents.printToPDF({}, (error, data) => {
		if (error) return console.error(error.message);

		fs.writeFile(pdfPath, data, (err) => {
			if (err) return console.error(err.message)
			shell.openExternal('file://' + pdfPath)
			log.info('Wrote PDF to ' + pdfPath)
			event.sender.send('wrote-pdf', pdfPath)
		})
	})
})



// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
	new createWindow
})

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

process.on('uncaughtException', (error) => {console.error(error)})