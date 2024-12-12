let courses = [];
let assignments = [];
let timerInterval;
let timeLeft = 25 * 60; // Default timer in seconds
let selectedAssignmentIndex = 0; // Default to the first item

class Assignment {
    constructor(course, name, dueDate, workedSeconds = 0) {
        this.course = course;
        this.name = name;
        this.dueDate = new Date(dueDate);
        this.workedSeconds = workedSeconds;
    }

    priority() {
        let now = new Date();
        let timeLeft = (this.dueDate - now) / 1000; // Time left in seconds
        if (timeLeft < 0) {
            timeLeft = Number.MAX_SAFE_INTEGER; // If past due, treat as highest urgency
        }
        return timeLeft / 3600 - this.workedSeconds / 3600; // Convert both to hours for easier comparison
    }

    addWorkTime(seconds) {
        this.workedSeconds += seconds;
    }
}

// Function to simulate file operations in the browser's context
function simulateFileOperations() {
    // Check if 'db' folder exists, if not, create it
    if (!fs.existsSync('db')) {
        fs.mkdirSync('db');
    }

    // Check and create files if they don't exist
    const files = ['courses.json', 'assignments.json'];
    files.forEach(file => {
        if (!fs.existsSync(`db/${file}`)) {
            fs.writeFileSync(`db/${file}`, JSON.stringify([]));
        }
    });

    // Load data from files
    courses = JSON.parse(fs.readFileSync('db/courses.json', 'utf8'));
    assignments = JSON.parse(fs.readFileSync('db/assignments.json', 'utf8')).map(a => 
        new Assignment(a.course, a.name, new Date(a.dueDate), a.workedSeconds)
    );
}

// Function to save data to the simulated file system
function saveData(key, data) {
    fs.writeFileSync(`db/${key}.json`, JSON.stringify(data));
}

function addCourse() {
    let courseName = document.getElementById('course-name').value.trim();
    if (courseName && !courses.includes(courseName)) { // Check if course doesn't already exist
        courses.push(courseName);
        saveData('courses', courses);
        updateCourseSelect(); // Update the course selection dropdown
        updateFilterSelect(); // Update the filter dropdown
        document.getElementById('course-name').value = ''; // Clear the input
    }
}

function updateCourseSelect() {
    let courseSelect = document.getElementById('course-select');
    courseSelect.innerHTML = ''; // Clear existing options
    courses.forEach(course => {
        let option = document.createElement('option');
        option.value = course;
        option.text = course;
        courseSelect.appendChild(option); // Append new option
    });
}

function updateFilterSelect() {
    let filterSelect = document.getElementById('filter-select');
    filterSelect.innerHTML = '<option value="all">All Courses</option>'; // Reset to default
    courses.forEach(course => {
        let option = document.createElement('option');
        option.value = course;
        option.text = course;
        filterSelect.appendChild(option); // Append new option
    });
}

function addAssignment() {
    let course = document.getElementById('course-select').value;
    let name = document.getElementById('assignment-name').value.trim();
    let dueDate = document.getElementById('due-date').value;

    if (course && name && dueDate) {
        assignments.push(new Assignment(course, name, dueDate));
        saveData('assignments', assignments);
        updateAssignmentList();
        document.getElementById('assignment-name').value = ''; // Clear the input
    }
}

function updateAssignmentList(filter = 'all') {
    let assignmentsList = document.getElementById('assignments');
    assignmentsList.innerHTML = '';

    let filteredAssignments = assignments.filter(a => filter === 'all' || a.course === filter);

    // Sort assignments by the new priority logic
    filteredAssignments.sort((a, b) => a.priority() - b.priority());

    filteredAssignments.forEach((assignment, index) => {
        let li = document.createElement('li');
        li.className = 'assignment-item';
        let isSelected = index === selectedAssignmentIndex ? 'checked' : '';
        li.innerHTML = `
            <input type="checkbox" class="select-task" onchange="selectTask(${index})" ${isSelected}>
            <span>${assignment.course} - ${assignment.name} - Due: ${assignment.dueDate.toDateString()} - Worked: ${(assignment.workedSeconds/60).toFixed(2)} mins</span>
        `;
        assignmentsList.appendChild(li);
    });
}

function selectTask(index) {
    // Deselect all checkboxes
    document.querySelectorAll('.select-task').forEach((checkbox, i) => {
        checkbox.checked = i === index;
    });
    selectedAssignmentIndex = index;
}

function filterAssignments() {
    let filter = document.getElementById('filter-select').value;
    updateAssignmentList(filter);
}

function toggleTimer() {
    let timerButton = document.getElementById('timer-button');
    let timerDisplay = document.getElementById('timer-display');
   
    if (timerButton.textContent === 'Start Working') {
        timerButton.textContent = 'Stop Working';
        timeLeft = parseInt(document.getElementById('timer-input').value) * 60; // Convert minutes to seconds
        timerDisplay.style.display = 'block';
        startTimer();
    } else {
        timerButton.textContent = 'Start Working';
        timerDisplay.style.display = 'none';
        stopTimer();
    }
}

function startTimer() {
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            stopTimer();
            alert("Time's up!");
        } else {
            updateTimerDisplay();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    if (selectedAssignmentIndex !== null && selectedAssignmentIndex < assignments.length) {
        assignments[selectedAssignmentIndex].addWorkTime(25 * 60 - timeLeft); // Log time worked
        saveData('assignments', assignments);
        updateAssignmentList();
    }
    timeLeft = 25 * 60; // Reset timer to default
    updateTimerDisplay();
}

function updateTimerDisplay() {
    let minutes = Math.floor(timeLeft / 60);
    let seconds = timeLeft % 60;
    document.getElementById('timer-display').textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}

function initialSetup() {
    simulateFileOperations();
    updateCourseSelect();
    updateFilterSelect();
    updateAssignmentList();
    document.getElementById('timer-input').value = '25'; // Set default value
}

// Call initial setup when the page loads
document.addEventListener('DOMContentLoaded', initialSetup);

// Add event listener for adding course when clicking the "Add Course" button
document.getElementById('course-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form from submitting
    addCourse();
});

// Add event listener for adding assignment when clicking the "Add Assignment" button
document.getElementById('project-form').addEventListener('submit', function(event) {
    event.preventDefault(); // Prevent form from submitting
    addAssignment();
});

// Here, we're assuming you have Node.js environment to run this. 
// In a browser context, you'll need server-side or IndexedDB for this functionality
const fs = require('fs');