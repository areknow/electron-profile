# Electron Pro-File 

Electron version of the popular Pro-File web app. Currently in beta and only tested on macOS Sierra.

![header image](https://raw.githubusercontent.com/areknow/electron-profile/master/git-header.jpg)


## Dev

```
$ npm install
```

### Run

```
$ npm start
```

### Build

```
$ npm run build
```

Builds the app for macOS, Linux, and Windows, using [electron-packager](https://github.com/electron-userland/electron-packager).

## Instructions
1. Install/build the app with the above instructions, or grab the macOS binary here (link)
2. Drag a support archive into the main window, or double click the window to access the file dialog
3. Wait for the analysis to complete
4. Find the unused measures in the new modal window that appears. Each system profile detected by the application will get its own modal window.
5. Clicking on a list item will add it to your clipboard. 

NOTE: Pro-File does not modify any system profiles. That is up to the Dynatrace Admin.


## License

[MIT](https://github.com/areknow/electron-profile/blob/master/license)
