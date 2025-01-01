const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { executeAlgorithm } = require(path.join(__dirname, 'finalAlgorithm.js'));

// Paths for JSON database
const assignmentsPath = path.join(__dirname, '..', 'db', 'assignments.json');
const coursesPath = path.join(__dirname, '..', 'db', 'courses.json');
const systemVariablesPath = path.join(__dirname, '..', 'db', 'system_variables.json');
const sessionWorkTimePath = path.join(__dirname, '../db/current_session_work_time.json');

// Function to load courses from the JSON database
async function loadCourses() {
    try {
        const data = await fs.promises.readFile(coursesPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading courses:', error);
        return [];
    }
}

// Function to save courses to the JSON database
async function saveCourses(courses) {
    try {
        await fs.promises.writeFile(coursesPath, JSON.stringify(courses, null, 2), 'utf-8');
    } catch (error) {
        console.error('Error saving courses:', error);
        throw error;
    }
}

async function loadSystemVariables() {
    try {
        const data = await fs.promises.readFile(systemVariablesPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading system variables:', error);
        return { defaultSessionDurationSeconds: 14400 }; // Fallback to 4 hours
    }
}

async function updateSystemVariables(newVariables) {
    try {
        await fs.promises.writeFile(systemVariablesPath, JSON.stringify(newVariables, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('Error updating system variables:', error);
        return false;
    }
}

async function logTime(assignmentId, secondsWorked) {
    const assignmentsPath = path.resolve(__dirname, '../db/assignments.json');

    try {
        const data = JSON.parse(fs.readFileSync(assignmentsPath, 'utf-8'));
        const assignment = data.find((a) => a.id === assignmentId);
        if (assignment) {
            assignment.workedSeconds += secondsWorked;
            fs.writeFileSync(assignmentsPath, JSON.stringify(data, null, 2));
            return { success: true };
        }
        return { success: false, error: 'Assignment not found' };
    } catch (error) {
        console.error('Error logging time:', error);
        return { success: false, error };
    }
}

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'), // Fix the path
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html')); // Ensure this path is correct too
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

// Function to add a new assignment with numeric ID
ipcMain.handle('addAssignment', async (event, course, name, dueDate) => {
    try {
        const assignments = fs.existsSync(assignmentsPath)
            ? JSON.parse(fs.readFileSync(assignmentsPath, 'utf-8'))
            : [];

        // Generate a unique numeric ID
        const newId = assignments.length > 0 
            ? Math.max(...assignments.map(a => a.id || 0)) + 1 
            : 1;

        // New assignment object
        const newAssignment = {
            id: newId, // Numeric ID
            course,
            name,
            dueDate,
            workedSeconds: 0 // Default worked time
        };

        // Add the new assignment and save
        assignments.push(newAssignment);
        fs.writeFileSync(assignmentsPath, JSON.stringify(assignments, null, 2));
        return { success: true, assignment: newAssignment };
    } catch (error) {
        console.error('Error adding assignment:', error);
        return { success: false, error };
    }
});

ipcMain.handle('deleteAssignment', async (event, id) => {
    const assignments = JSON.parse(fs.readFileSync(assignmentsPath, 'utf8'));
    const updatedAssignments = assignments.filter((assignment) => assignment.id !== id);
    fs.writeFileSync(assignmentsPath, JSON.stringify(updatedAssignments, null, 2));
    return true;
});

ipcMain.handle('editAssignment', async (event, assignmentId, newDueDate) => {
    try {
        // Load assignments from the database
        const data = await fs.promises.readFile(assignmentsPath, 'utf-8');
        const assignments = JSON.parse(data);

        // Update the assignment with the new due date
        const updatedAssignments = assignments.map((assignment) => {
            if (assignment.id === assignmentId) {
                return { ...assignment, dueDate: newDueDate };
            }
            return assignment;
        });

        // Save the updated assignments back to the file
        await fs.promises.writeFile(assignmentsPath, JSON.stringify(updatedAssignments, null, 2), 'utf-8');

        return true; // Indicate success
    } catch (error) {
        console.error('Error updating assignment:', error);
        return false; // Indicate failure
    }
});

ipcMain.handle('deleteCourse', async (event, courseName) => {
    try {
        // Load courses from the database
        const coursesData = await fs.promises.readFile(coursesPath, 'utf-8');
        const courses = JSON.parse(coursesData);

        // Filter out the deleted course
        const updatedCourses = courses.filter((course) => course !== courseName);

        // Save updated courses back to the database
        await fs.promises.writeFile(coursesPath, JSON.stringify(updatedCourses, null, 2), 'utf-8');

        // Load assignments from the database
        const assignmentsData = await fs.promises.readFile(assignmentsPath, 'utf-8');
        const assignments = JSON.parse(assignmentsData);

        // Filter out assignments associated with the deleted course
        const updatedAssignments = assignments.filter(
            (assignment) => assignment.course !== courseName
        );

        // Save updated assignments back to the database
        await fs.promises.writeFile(
            assignmentsPath,
            JSON.stringify(updatedAssignments, null, 2), 
            'utf-8'
        );

        // Return updated data to the frontend
        return { courses: updatedCourses, assignments: updatedAssignments };
    } catch (error) {
        console.error('Error deleting course and associated assignments:', error);
        throw error; // Propagate error to the frontend
    }
});

ipcMain.handle('updateSessionWorkTime', async (event, sessionWorkTime) => {
    try {
        // Overwrite the file with the updated session work time
        await fs.promises.writeFile(sessionWorkTimePath, JSON.stringify(sessionWorkTime, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('Error updating session work time:', error);
        return false;
    }
});

// Handle log time requests from renderer
ipcMain.handle('log-time', async (event, assignmentId, secondsWorked) => {
    return await logTime(assignmentId, secondsWorked);
});

ipcMain.handle('getSessionWorkTime', async () => {
    try {
        const data = fs.existsSync(sessionWorkTimePath)
            ? JSON.parse(await fs.promises.readFile(sessionWorkTimePath, 'utf-8'))
            : [];
        return data;
    } catch (error) {
        console.error('Error fetching session work time:', error);
        return [];
    }
});

ipcMain.handle('clearSessionWorkTime', async () => {
    try {
        // Overwrite the file with an empty array
        await fs.promises.writeFile(sessionWorkTimePath, JSON.stringify([], null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('Error clearing session work time:', error);
        return false;
    }
});

// Fetch system variables from the database
ipcMain.handle('getSystemVariables', async () => {
    try {
        const data = await fs.promises.readFile(systemVariablesPath, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error fetching system variables:', error);
        return { defaultSessionDurationSeconds: 14400, currentSessionLoggedSeconds: 0, lastTimeSessionReset: null }; // Default fallback
    }
});

// Update system variables in the database
ipcMain.handle('updateSystemVariables', async (event, updatedVariables) => {
    try {
        await fs.promises.writeFile(systemVariablesPath, JSON.stringify(updatedVariables, null, 2), 'utf-8');
        return true;
    } catch (error) {
        console.error('Error updating system variables:', error);
        return false;
    }
});

// Handle algorithm execution
ipcMain.handle('execute-algorithm', async () => {
    try {
        const result = executeAlgorithm();
        return { success: true, result };
    } catch (error) {
        console.error('Error executing algorithm:', error);
        return { success: false, error: error.message };
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