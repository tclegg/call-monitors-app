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

console.log(`DEV ENVIRONMENT = ${isDev}`);


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
    console.log('in conditional');
    
		// Open the DevTools.
    mainWindow.webContents.openDevTools()
	}

	//mainWindow.webContents.send('ipc-message', testArgs)
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


  require('./menu/mainmenu')
}

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
