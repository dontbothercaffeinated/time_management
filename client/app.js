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

function updateCourseSelect() {
    let courseSelect = document.getElementById('course-select');
    courseSelect.innerHTML = ''; // Clear existing options
    courses.forEach(course => {
        let option = document.createElement('option');
        option.value = course;
        option.text = course;
        courseSelect.appendChild(option);
    });
}

function updateFilterSelect() {
    let filterSelect = document.getElementById('filter-select');
    filterSelect.innerHTML = '<option value="all">All Courses</option>'; // Reset to default
    courses.forEach(course => {
        let option = document.createElement('option');
        option.value = course;
        option.text = course;
        filterSelect.appendChild(option);
    });
}

function updateAssignmentList(filter = 'all') {
    let assignmentsList = document.getElementById('assignments');
    assignmentsList.innerHTML = '';

    let filteredAssignments = assignments.filter(a => filter === 'all' || a.course === filter);

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
        updateAssignment(assignments[selectedAssignmentIndex], 25 * 60 - timeLeft); // Log time worked
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
    fetchData();
    updateCourseSelect();
    updateFilterSelect();
    updateAssignmentList();
    document.getElementById('timer-input').value = '25'; // Set default value
}

// Fetch data from server
async function fetchData() {
    try {
        const response = await fetch('/data');
        const data = await response.json();
        courses = data.courses;
        assignments = data.assignments.map(a => new Assignment(a.course, a.name, new Date(a.dueDate), a.workedSeconds));
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

// Add new course to server
async function addCourse() {
    let courseName = document.getElementById('course-name').value.trim();
    if (courseName && !courses.includes(courseName)) {
        try {
            const response = await fetch('/add-course', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ course: courseName }),
            });
            
            if (response.ok) {
                await fetchData();
                updateCourseSelect();
                updateFilterSelect();
                document.getElementById('course-name').value = ''; // Clear the input
            } else {
                console.error('Failed to add course');
            }
        } catch (error) {
            console.error('Error adding course:', error);
        }
    }
}

// Add new assignment to server
async function addAssignment() {
    let course = document.getElementById('course-select').value;
    let name = document.getElementById('assignment-name').value.trim();
    let dueDate = document.getElementById('due-date').value;

    if (course && name && dueDate) {
        try {
            const response = await fetch('/add-assignment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    course: course,
                    name: name,
                    dueDate: dueDate
                }),
            });
            
            if (response.ok) {
                await fetchData();
                updateAssignmentList();
                document.getElementById('assignment-name').value = ''; // Clear the input
            } else {
                console.error('Failed to add assignment');
            }
        } catch (error) {
            console.error('Error adding assignment:', error);
        }
    }
}

// Update assignment on server (used when stopping the timer)
async function updateAssignment(assignment, workedSeconds) {
    assignment.addWorkTime(workedSeconds);
    try {
        const response = await fetch('/update-assignment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(assignment),
        });
        
        if (!response.ok) {
            console.error('Failed to update assignment');
        }
    } catch (error) {
        console.error('Error updating assignment:', error);
    }
}

document.addEventListener('DOMContentLoaded', initialSetup);

document.getElementById('course-form').addEventListener('submit', function(event) {
    event.preventDefault();
    addCourse();
});

document.getElementById('project-form').addEventListener('submit', function(event) {
    event.preventDefault();
    addAssignment();
});