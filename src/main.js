const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Paths for JSON database
const assignmentsPath = path.join(__dirname, '..', 'db', 'assignments.json');
const coursesPath = path.join(__dirname, '..', 'db', 'courses.json');

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


app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});