const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../db');
const assignmentsFile = path.join(dbDir, 'assignments.json');
const coursesFile = path.join(dbDir, 'courses.json');

function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    win.loadFile('src/index.html');
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

ipcMain.handle('fetchData', async () => {
    const assignments = JSON.parse(fs.readFileSync(assignmentsFile, 'utf8'));
    const courses = JSON.parse(fs.readFileSync(coursesFile, 'utf8'));
    return { assignments, courses };
});

ipcMain.handle('addCourse', async (event, course) => {
    const courses = JSON.parse(fs.readFileSync(coursesFile, 'utf8'));
    if (!courses.includes(course)) {
        courses.push(course);
        fs.writeFileSync(coursesFile, JSON.stringify(courses));
    }
});

ipcMain.handle('addAssignment', async (event, course, name, dueDate) => {
    const assignments = JSON.parse(fs.readFileSync(assignmentsFile, 'utf8'));
    assignments.push({ course, name, dueDate });
    fs.writeFileSync(assignmentsFile, JSON.stringify(assignments));
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});