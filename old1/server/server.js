const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'client')));

// Helper function to read JSON files
function readJSONFile(filePath) {
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (error) {
        console.error(`Error reading file from disk: ${error}`);
        return [];
    }
}

// Helper function to write JSON files
function writeJSONFile(filePath, data) {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`Error writing file to disk: ${error}`);
    }
}

// Endpoint to fetch all data
app.get('/data', (req, res) => {
    const courses = readJSONFile(path.join(__dirname, '..', 'db', 'courses.json'));
    const assignments = readJSONFile(path.join(__dirname, '..', 'db', 'assignments.json'));
    res.json({ courses, assignments });
});

// Endpoint to add a new course
app.post('/add-course', (req, res) => {
    const courseFile = path.join(__dirname, '..', 'db', 'courses.json');
    let courses = readJSONFile(courseFile);
    
    if (!courses.includes(req.body.course)) {
        courses.push(req.body.course);
        writeJSONFile(courseFile, courses);
    }
    res.sendStatus(200);
});

// Endpoint to add a new assignment
app.post('/add-assignment', (req, res) => {
    const assignmentFile = path.join(__dirname, '..', 'db', 'assignments.json');
    let assignments = readJSONFile(assignmentFile);
    
    assignments.push({
        course: req.body.course,
        name: req.body.name,
        dueDate: req.body.dueDate,
        workedSeconds: 0
    });
    writeJSONFile(assignmentFile, assignments);
    res.sendStatus(200);
});

// Endpoint to update an assignment (used when stopping the timer)
app.post('/update-assignment', (req, res) => {
    const assignmentFile = path.join(__dirname, '..', 'db', 'assignments.json');
    let assignments = readJSONFile(assignmentFile);
    
    const index = assignments.findIndex(a => 
        a.course === req.body.course && 
        a.name === req.body.name && 
        a.dueDate === req.body.dueDate.toISOString()
    );

    if (index !== -1) {
        assignments[index] = req.body;
        writeJSONFile(assignmentFile, assignments);
        res.sendStatus(200);
    } else {
        res.status(404).send('Assignment not found');
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});