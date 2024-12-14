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
    try {
        const assignments = JSON.parse(fs.readFileSync(assignmentsFile, 'utf8'));
        const courses = JSON.parse(fs.readFileSync(coursesFile, 'utf8'));
        return { assignments, courses };
    } catch (error) {
        console.error('Error reading data files:', error);
        return { assignments: [], courses: [] };
    }
});

ipcMain.handle('addCourse', async (event, course) => {
    try {
        const courses = JSON.parse(fs.readFileSync(coursesFile, 'utf8'));
        if (!courses.includes(course)) {
            courses.push(course);
            fs.writeFileSync(coursesFile, JSON.stringify(courses, null, 2));
        }
    } catch (error) {
        console.error('Error adding course:', error);
    }
});

ipcMain.handle('addAssignment', async (event, course, name, dueDate) => {
    try {
        const assignments = JSON.parse(fs.readFileSync(assignmentsFile, 'utf8'));
        assignments.push({ id: Date.now(), course, name, dueDate, workedSeconds: 0 });
        fs.writeFileSync(assignmentsFile, JSON.stringify(assignments, null, 2));
    } catch (error) {
        console.error('Error adding assignment:', error);
    }
});

ipcMain.handle('saveAssignmentTime', async (event, assignmentId, additionalSeconds) => {
    try {
        const assignments = JSON.parse(fs.readFileSync(assignmentsFile, 'utf8'));
        const index = assignments.findIndex(a => a.id === assignmentId);
        if (index !== -1) {
            assignments[index].workedSeconds += additionalSeconds; // Increment existing time
            fs.writeFileSync(assignmentsFile, JSON.stringify(assignments, null, 2));
        }
    } catch (error) {
        console.error('Error saving assignment time:', error);
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});