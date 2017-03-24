# Electron Pro-File 

Electron version of the popular Pro-File web app. Currently in beta and only tested on macOS Sierra.

![header image](https://raw.githubusercontent.com/areknow/electron-profile/master/git-header.jpg)

## About

ProFile has been developed to help eliminate “measure explosion”, and to assist in the performance of the Dynatrace Server. The application will scan all the measures in each profile and find out if they are being used in any business transaction, incident, or dashboard. This information can then be used to clean up your system profile to reduce overhead and maintain a high performance server.

### Dev

```
$ npm install
```

### Run

```
$ npm start
```

### Build macOS

```
$ npm run build:osx
```

### Build Windows

```
$ npm run build:win
```

Builds the app for macOS, Linux, and Windows, using [electron-packager](https://github.com/electron-userland/electron-packager).

## Instructions
1. Install/build the app with the above instructions, or grab the macOS binary here (link coming soon)
2. Drag a support archive into the main window, or double click the window to access the file dialog. An example support archive has been included in the ```/example``` dir. More information on Dynatrace AppMon support archives here: [Getting Support](https://community.dynatrace.com/community/display/DOCDT63/Getting+Support).
3. Wait for the analysis to complete.
4. Find the unused measures in the new modal window that appears. Each system profile detected by the application will get its own modal window.
5. Clicking on a list item will add it to your clipboard. 

NOTE: Pro-File does not modify any system profiles. That is up to the Dynatrace Admin.


## License

[MIT](https://github.com/areknow/electron-profile/blob/master/license)
