let courses = [];
let assignments = [];
let selectedAssignmentIndex = 0;
let editingAssignmentIndex = null; // Track the assignment being edited
let timerInterval = null;
let selectedAssignmentId = null;

// Fetch data from the backend
async function fetchData() {
    try {
        const response = await window.electron.fetchData();
        courses = response.courses;
        assignments = response.assignments;

        // Update the UI
        updateUI();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function updateUI() {
    updateCourseSelect();    // Refresh course dropdowns
    updateFilterSelect();    // Refresh "All Courses" dropdown
    updateAssignmentList();  // Refresh assignments list
    resetAssignmentForm();   // Reset the add-assignment form
    populateCourseList();   // Refresh Manage Courses list
}

// Function to reset the add-assignment form fields
function resetAssignmentForm() {
    const courseInput = document.getElementById('course-select'); // Course dropdown
    const nameInput = document.getElementById('assignment-name'); // Assignment name input
    const dueDateInput = document.getElementById('due-date');     // Date input field

    // Reset inputs to default values
    if (courseInput) courseInput.value = '';   // Reset the course dropdown
    if (nameInput) nameInput.value = '';       // Reset the assignment name input
    if (dueDateInput) dueDateInput.value = ''; // Reset the date selector to default (blank)
}

function updateCourseSelect() {
    const courseSelect = document.getElementById('course-select');
    courseSelect.innerHTML = '<option value="">Select a Course</option>';
    courses.forEach((course) => {
        const option = document.createElement('option');
        option.value = course;
        option.textContent = course;
        courseSelect.appendChild(option);
    });
}

function updateFilterSelect() {
    const filterSelect = document.getElementById('filter-select');
    filterSelect.innerHTML = '<option value="all">All Courses</option>';
    courses.forEach((course) => {
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
        (a) => filter === 'all' || a.course === filter
    );

    filteredAssignments.forEach((assignment, index) => {
        const li = document.createElement('li');
        li.classList.add('assignment-item');
        li.innerHTML = `
            <input type="radio" name="selected-assignment" value="${assignment.id}" id="assignment-${assignment.id}" />
            <label for="assignment-${assignment.id}">
                ${assignment.course} - ${assignment.name} - Due: ${assignment.dueDate} - Worked: ${(assignment.workedSeconds / 60).toFixed(2)} mins
            </label>
            <button class="edit-button">Edit</button>
            <button class="delete-button">Delete</button>
        `;
        assignmentsList.appendChild(li);

        li.querySelector('.edit-button').addEventListener('click', () => showEditPopup(index));
        li.querySelector('.delete-button').addEventListener('click', () => deleteAssignment(index));
        // Add event listener for radio button selection
        li.querySelector(`input[type="radio"]`).addEventListener('change', (event) => {
            selectedAssignmentId = parseInt(event.target.value, 10);
        });
    });
}

function handleStartStopButton() {
    const button = document.getElementById('start-stop-button');
    const workDuration = parseInt(document.getElementById('work-duration').value, 10) * 60; // Convert to seconds
    const countdownTimer = document.getElementById('countdown-timer');
    const timeRemaining = document.getElementById('time-remaining');

    if (button.textContent === 'Start Working') {
        if (selectedAssignmentId === null) {
            alert('Please select an assignment to work on.');
            return;
        }

        // Start timer
        let remainingTime = workDuration;
        countdownTimer.style.display = 'block';
        timeRemaining.textContent = formatTime(remainingTime);

        timerInterval = setInterval(() => {
            remainingTime -= 1;
            timeRemaining.textContent = formatTime(remainingTime);

            if (remainingTime <= 0) {
                clearInterval(timerInterval);
                alert('Time is up!');
                logWorkTime(workDuration); // Log the total time worked
                resetTimer();
            }
        }, 1000);

        button.textContent = 'Stop Working';
        button.classList.add('stop');
    } else {
        // Stop timer
        clearInterval(timerInterval);
        logWorkTime(workDuration - parseInt(timeRemaining.textContent.split(':').reduce((acc, time) => (60 * acc) + +time), 10));
        resetTimer();
    }
}

function resetTimer() {
    document.getElementById('start-stop-button').textContent = 'Start Working';
    document.getElementById('start-stop-button').classList.remove('stop');
    document.getElementById('countdown-timer').style.display = 'none';
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

async function logWorkTime(secondsWorked) {
    if (selectedAssignmentId === null) return;

    console.log('Logging work time for assignment ID:', selectedAssignmentId); // Debugging

    try {
        const response = await window.electron.logTime(selectedAssignmentId, secondsWorked);
        if (response.success) {
            fetchData(); // Refresh data to reflect changes
        } else {
            console.error('Failed to log work time:', response.error);
        }
    } catch (error) {
        console.error('Error logging work time:', error);
    }
}

async function deleteAssignment(index) {
    const assignment = assignments[index];
    if (confirm(`Are you sure you want to delete "${assignment.name}"?`)) {
        try {
            await window.electron.deleteAssignment(assignment.id);
            fetchData();
        } catch (error) {
            console.error('Error deleting assignment:', error);
        }
    }
}

function showEditPopup(index) {
    const assignment = assignments[index];
    editingAssignmentIndex = index;

    // Populate the popup input with the current due date
    const popup = document.getElementById('edit-popup');
    const popupDueDate = document.getElementById('popup-due-date');
    popupDueDate.value = assignment.dueDate;

    // Show the popup
    popup.style.display = 'flex';
}

async function saveEditPopup() {
    const popupDueDate = document.getElementById('popup-due-date').value;
    const popup = document.getElementById('edit-popup');

    if (popupDueDate && editingAssignmentIndex !== null) {
        try {
            const assignment = assignments[editingAssignmentIndex];
            const result = await window.electron.editAssignment(assignment.id, popupDueDate);

            if (result) {
                // Close the popup and refresh the UI
                popup.style.display = 'none';
                editingAssignmentIndex = null;
                fetchData(); // Refresh the assignments list
            } else {
                console.error('Failed to save edited due date.');
            }
        } catch (error) {
            console.error('Error saving edited due date:', error);
        }
    }
}

function cancelEditPopup() {
    const popup = document.getElementById('edit-popup');
    popup.style.display = 'none';
    editingAssignmentIndex = null;
}

document.getElementById('save-popup-button').addEventListener('click', saveEditPopup);
document.getElementById('cancel-popup-button').addEventListener('click', cancelEditPopup);

document.getElementById('course-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const courseNameInput = document.getElementById('course-name');
    const courseName = courseNameInput.value.trim();
    if (courseName) {
        try {
            await window.electron.addCourse(courseName);
            fetchData();
            courseNameInput.value = '';
        } catch (error) {
            console.error('Error adding course:', error);
        }
    }
});

document.getElementById('project-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const course = document.getElementById('course-select').value;
    const name = document.getElementById('assignment-name').value.trim();
    const dueDate = document.getElementById('due-date').value;

    if (course && name && dueDate) {
        try {
            // Pass the selected date as-is (no UTC conversion)
            await window.electron.addAssignment(course, name, dueDate);
            fetchData(); // Refresh the UI with the new assignment (includes reset)
        } catch (error) {
            console.error('Error adding assignment:', error);
        }
    }
});

document.getElementById('filter-select').addEventListener('change', (event) => {
    updateAssignmentList(event.target.value);
});

// Attach event listeners for the Manage Courses button
document.getElementById('manage-courses-button').addEventListener('click', () => {
    showManageCoursesPopup();
});

function showManageCoursesPopup() {
    const popup = document.getElementById('manage-courses-popup');
    populateCourseList(); // Populate courses when opening
    popup.style.display = 'flex';
}

function hideManageCoursesPopup() {
    const popup = document.getElementById('manage-courses-popup');
    popup.style.display = 'none';
}

function populateCourseList() {
    const courseList = document.getElementById('course-list');
    courseList.innerHTML = ''; // Clear the current list

    courses.forEach((course, index) => {
        const li = document.createElement('li');
        li.textContent = course;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.addEventListener('click', () => deleteCourse(index));

        li.appendChild(deleteButton);
        courseList.appendChild(li);
    });
}

async function deleteCourse(index) {
    const courseToDelete = courses[index];
    if (confirm(`Are you sure you want to delete "${courseToDelete}" and all its assignments?`)) {
        try {
            const result = await window.electron.deleteCourse(courseToDelete);
            if (result) {
                // Remove the course from the local array
                courses.splice(index, 1);

                // Remove assignments associated with the deleted course from the local array
                assignments = assignments.filter(
                    (assignment) => assignment.course !== courseToDelete
                );

                // Refresh all UI elements: course list, dropdowns, and assignments
                updateUI(); // Refresh the UI immediately
            } else {
                console.error('Failed to delete course and associated assignments.');
            }
        } catch (error) {
            console.error('Error deleting course:', error);
        }
    }
}

// Attach event listener for closing the Manage Courses popup
document.getElementById('close-manage-courses').addEventListener('click', hideManageCoursesPopup);
// Add Event Listener for the Start/Stop Button
document.getElementById('start-stop-button').addEventListener('click', handleStartStopButton);


fetchData();