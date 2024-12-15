const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Paths for JSON database
const assignmentsPath = path.join(__dirname, '..', 'db', 'assignments.json');
const coursesPath = path.join(__dirname, '..', 'db', 'courses.json');

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    mainWindow.loadFile('src/index.html');
}

ipcMain.handle('fetchData', async () => {
    const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
    const assignments = JSON.parse(fs.readFileSync(assignmentsPath, 'utf8'));
    return { courses, assignments };
});

ipcMain.handle('addCourse', async (event, courseName) => {
    const courses = JSON.parse(fs.readFileSync(coursesPath, 'utf8'));
    if (!courses.includes(courseName)) {
        courses.push(courseName);
        fs.writeFileSync(coursesPath, JSON.stringify(courses, null, 2));
    }
    return true;
});

ipcMain.handle('addAssignment', async (event, course, name, dueDate) => {
    const assignments = JSON.parse(fs.readFileSync(assignmentsPath, 'utf8'));
    const id = `assignment-${Date.now()}`;
    assignments.push({ id, course, name, dueDate, workedSeconds: 0, priority: 0 });
    fs.writeFileSync(assignmentsPath, JSON.stringify(assignments, null, 2));
    return true;
});

ipcMain.handle('deleteAssignment', async (event, id) => {
    const assignments = JSON.parse(fs.readFileSync(assignmentsPath, 'utf8'));
    const updatedAssignments = assignments.filter((assignment) => assignment.id !== id);
    fs.writeFileSync(assignmentsPath, JSON.stringify(updatedAssignments, null, 2));
    return true;
});

ipcMain.handle('editAssignment', async (event, id, newDueDate) => {
    const assignments = JSON.parse(fs.readFileSync(assignmentsPath, 'utf8'));
    const assignment = assignments.find((assignment) => assignment.id === id);
    if (assignment) {
        assignment.dueDate = newDueDate;
        fs.writeFileSync(assignmentsPath, JSON.stringify(assignments, null, 2));
        return true;
    } else {
        throw new Error('Assignment not found');
    }
});

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});