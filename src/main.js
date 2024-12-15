const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const log = require('electron-log');

// Paths to database files
const dbDir = path.join(__dirname, '../db');
const assignmentsFile = path.join(dbDir, 'assignments.json');
const coursesFile = path.join(dbDir, 'courses.json');

// Setup logging
log.transports.file.level = 'debug';
log.info('Application starting...');

// Ensure database files exist
function ensureDbFilesExist() {
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir);
        log.info('Database directory created.');
    }

    if (!fs.existsSync(assignmentsFile)) {
        fs.writeFileSync(assignmentsFile, JSON.stringify([]));
        log.info('Assignments file created and initialized.');
    }

    if (!fs.existsSync(coursesFile)) {
        fs.writeFileSync(coursesFile, JSON.stringify([]));
        log.info('Courses file created and initialized.');
    }
}

// Create the application window
function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
    });

    win.loadFile('src/index.html');
    log.info('Main window created and index.html loaded.');
}

// Priority calculation logic
function calculatePriority(assignment) {
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);

    // Calculate days left and worked hours
    const daysLeft = Math.max(1, (dueDate - now) / (1000 * 60 * 60 * 24)); // Days remaining, at least 1
    const workedHours = assignment.workedSeconds / 3600; // Convert worked seconds to hours

    // Priority: closer due dates and less worked time increase priority
    const priority = (1 / daysLeft) + (1 / (workedHours + 1)); // Adding 1 prevents division by zero

    log.debug(`Calculated priority for assignment "${assignment.name}": Days Left = ${daysLeft}, Worked Hours = ${workedHours}, Priority = ${priority}`);
    return priority;
}

// Update priorities and sort assignments
function updatePriorities(assignments) {
    assignments.forEach((assignment) => {
        assignment.priority = calculatePriority(assignment);
    });
    assignments.sort((a, b) => b.priority - a.priority);
    log.info('Assignments prioritized and sorted.');
}

// Fetch data handler
ipcMain.handle('fetchData', async () => {
    try {
        const assignments = JSON.parse(fs.readFileSync(assignmentsFile, 'utf8') || '[]');
        const courses = JSON.parse(fs.readFileSync(coursesFile, 'utf8') || '[]');
        updatePriorities(assignments);
        log.info('Data fetched successfully.');
        return { assignments, courses };
    } catch (error) {
        log.error('Error reading data files:', error);
        throw error;
    }
});

// Add a new course
ipcMain.handle('addCourse', async (event, courseName) => {
    try {
        const courses = JSON.parse(fs.readFileSync(coursesFile, 'utf8') || '[]');
        courses.push(courseName);
        fs.writeFileSync(coursesFile, JSON.stringify(courses));
        log.info(`Course added: ${courseName}`);
    } catch (error) {
        log.error('Error adding course:', error);
        throw error;
    }
});

// Add a new assignment
ipcMain.handle('addAssignment', async (event, course, name, dueDate) => {
    try {
        const assignments = JSON.parse(fs.readFileSync(assignmentsFile, 'utf8') || '[]');
        const newAssignment = {
            id: Date.now(),
            course,
            name,
            dueDate,
            workedSeconds: 0,
            priority: 0,
        };
        assignments.push(newAssignment);
        updatePriorities(assignments);
        fs.writeFileSync(assignmentsFile, JSON.stringify(assignments));
        log.info(`Assignment added: ${name} for course ${course}.`);
    } catch (error) {
        log.error('Error adding assignment:', error);
        throw error;
    }
});

// Save time worked on an assignment
ipcMain.handle('saveAssignmentTime', async (event, assignmentId, additionalSeconds) => {
    try {
        const assignments = JSON.parse(fs.readFileSync(assignmentsFile, 'utf8') || '[]');
        const assignment = assignments.find((a) => a.id === assignmentId);
        if (assignment) {
            assignment.workedSeconds += additionalSeconds;
            log.info(`Time logged for assignment "${assignment.name}": ${additionalSeconds} seconds.`);
            updatePriorities(assignments);
            fs.writeFileSync(assignmentsFile, JSON.stringify(assignments));
        } else {
            log.warn(`Assignment with ID ${assignmentId} not found.`);
        }
    } catch (error) {
        log.error('Error saving assignment time:', error);
        throw error;
    }
});

// Electron app lifecycle
app.whenReady().then(() => {
    ensureDbFilesExist();
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});