let courses = [];
let assignments = [];
let selectedAssignmentIndex = 0;
let timerInterval;
let timeLeft;

// Fetch data from the backend (filesystem)
async function fetchData() {
    const response = await window.electron.fetchData();
    courses = response.courses;
    assignments = response.assignments.map(a => ({ ...a, workedSeconds: a.workedSeconds || 0 }));
    updateUI();
}

function updateUI() {
    updateCourseSelect();
    updateFilterSelect();
    updateAssignmentList();
    resetAddAssignmentForm();
}

function updateCourseSelect() {
    const courseSelect = document.getElementById('course-select');
    courseSelect.innerHTML = '<option value="">Select a Course</option>';
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course;
        option.textContent = course;
        courseSelect.appendChild(option);
    });
}

function updateFilterSelect() {
    const filterSelect = document.getElementById('filter-select');
    filterSelect.innerHTML = '<option value="all">All Courses</option>';
    courses.forEach(course => {
        const option = document.createElement('option');
        option.value = course;
        option.textContent = course;
        filterSelect.appendChild(option);
    });
}

function updateAssignmentList(filter = 'all') {
    const assignmentsList = document.getElementById('assignments');
    assignmentsList.innerHTML = '';
    const filteredAssignments = assignments.filter(
        a => filter === 'all' || a.course === filter
    );

    filteredAssignments.forEach((assignment, index) => {
        const li = document.createElement('li');
        li.classList.add('assignment-item');
        li.innerHTML = `
            <input type="radio" name="selected-assignment" class="select-task" onchange="selectTask(${index})" ${index === selectedAssignmentIndex ? 'checked' : ''}>
            <span>${assignment.course} - ${assignment.name} - Due: ${new Date(assignment.dueDate).toDateString()} - Worked: ${(assignment.workedSeconds / 60).toFixed(2)} mins</span>
        `;
        assignmentsList.appendChild(li);
    });

    if (filteredAssignments.length > 0) {
        selectTask(0); // Default to the first assignment
    }
}

function selectTask(index) {
    selectedAssignmentIndex = index;
}

async function handleAddCourse(event) {
    event.preventDefault();
    const courseNameInput = document.getElementById('course-name');
    const courseName = courseNameInput.value.trim();
    if (courseName) {
        await window.electron.addCourse(courseName);
        fetchData();
        courseNameInput.value = ''; // Clear the input field after successful addition
    }
}

async function handleAddAssignment(event) {
    event.preventDefault();
    const course = document.getElementById('course-select').value;
    const name = document.getElementById('assignment-name').value.trim();
    const dueDate = document.getElementById('due-date').value;

    if (course && name && dueDate) {
        await window.electron.addAssignment(course, name, dueDate);
        fetchData();
    }
}

function resetAddAssignmentForm() {
    document.getElementById('course-select').value = '';
    document.getElementById('assignment-name').value = '';
    document.getElementById('due-date').value = '';
}

function toggleTimer() {
    const timerButton = document.getElementById('timer-button');
    const timerDisplay = document.getElementById('timer-display');
    const timerInput = parseInt(document.getElementById('timer-input').value);

    if (timerButton.textContent === 'Start Working') {
        if (!assignments[selectedAssignmentIndex]) {
            alert('No assignment selected!');
            return;
        }

        timerButton.textContent = 'Stop Working';
        timeLeft = timerInput * 60; // Convert minutes to seconds
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
        if (timeLeft <= 0) {
            stopTimer();
            alert("Time's up!");
        } else {
            timeLeft--;
            updateTimerDisplay();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    if (assignments[selectedAssignmentIndex]) {
        const workedSeconds = parseInt(document.getElementById('timer-input').value) * 60 - timeLeft;
        assignments[selectedAssignmentIndex].workedSeconds = (assignments[selectedAssignmentIndex].workedSeconds || 0) + workedSeconds;
        saveTimeToDatabase(assignments[selectedAssignmentIndex]).then(() => {
            updateAssignmentList();
        });
    }
    timeLeft = null;
}

function updateTimerDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    document.getElementById('timer-display').textContent = `${minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
}

async function saveTimeToDatabase(assignment) {
    try {
        await window.electron.updateAssignmentTime(assignment);
    } catch (error) {
        console.error('Failed to save time to database:', error);
    }
}

document.getElementById('course-form').addEventListener('submit', handleAddCourse);
document.getElementById('project-form').addEventListener('submit', handleAddAssignment);
document.getElementById('timer-button').addEventListener('click', toggleTimer);
document.getElementById('filter-select').addEventListener('change', (event) => {
    const filter = event.target.value;
    updateAssignmentList(filter);
});

fetchData();