let courses = [];
let assignments = [];
let selectedAssignmentIndex = 0;
let editingAssignmentIndex = null; // Track the assignment being edited
let timerInterval = null;
let selectedAssignmentId = null;
let dashboardLinks = [];

// Fetch data from the backend
async function fetchData() {
    try {
        // Fetch system variables for session duration
        const systemVariables = await window.electron.getSystemVariables();
        
        // Add this to update UI elements dynamically
        document.getElementById('session-duration').textContent = formatSessionTime(systemVariables.defaultSessionDurationSeconds);
        // fetch data from current_session_work_time.json total seconds on all assignments
        // the sum of all seconds for all assignments is the total seconds worked in current session
        try {
            const sessionWorkTime = await window.electron.getSessionWorkTime();
            const totalLoggedSeconds = sessionWorkTime.reduce((sum, entry) => sum + entry.timeWorked, 0);
            document.getElementById('time-logged').textContent = formatSessionTime(totalLoggedSeconds);
        } catch (error) {
            console.error('Error fetching session work time:', error);
        }

        // Update percentage worked
        const percentageWorkedElement = document.getElementById('percentage-worked');
        if (percentageWorkedElement) {
            const percentage = ((systemVariables.currentSessionLoggedSeconds / systemVariables.defaultSessionDurationSeconds) * 100).toFixed(2);
            percentageWorkedElement.textContent = `${isNaN(percentage) ? 0 : percentage}%`;
        }

        // Update hours since last reset
        const lastResetElement = document.getElementById('hours-since-reset');
        if (lastResetElement) {
            const currentTimestamp = Math.floor(Date.now() / 1000); // Current Unix timestamp
            const hoursSinceReset = Math.floor((currentTimestamp - systemVariables.lastTimeSessionReset) / 3600); // Calculate hours
            lastResetElement.textContent = `${hoursSinceReset} hours since last reset`;
        }

        const response = await window.electron.fetchData();
        courses = response.courses;
        assignments = response.assignments;

        // Update the UI
        updateUI();
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function updateSessionDuration(newDurationSeconds) {
    try {
        // Fetch the current system variables
        const systemVariables = await window.electron.getSystemVariables();

        // Update only the "defaultSessionDurationSeconds" field
        systemVariables.defaultSessionDurationSeconds = newDurationSeconds;

        // Save the updated system variables back to the database
        const updated = await window.electron.updateSystemVariables(systemVariables);

        if (updated) {
            alert('Session duration updated successfully!');
            fetchData(); // Refresh data to reflect changes
        } else {
            alert('Failed to update session duration.');
        }
    } catch (error) {
        console.error('Error updating session duration:', error);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    // related to main dashboard link bubbles
    fetchLinks();
    startLiveUpdate(); // Start live updates for hours since reset
});

async function fetchLinks() {
    try {
        dashboardLinks = await window.electron.getLinks();
        updateLinkBubbles();
    } catch (error) {
        console.error('Error fetching links:', error);
    }
}

function updateLinkBubbles() {
    const linkContainer = document.getElementById('link-bubbles');
    linkContainer.innerHTML = '';
    dashboardLinks.forEach(link => {
        const bubble = document.createElement('div');
        bubble.className = 'link-bubble';
        bubble.textContent = link.name;
        
        // Open link in the default browser on click
        bubble.addEventListener('click', () => {
            window.electron.openExternalLink(link.url);
        });

        linkContainer.appendChild(bubble);
    });
}

function showAddLinkPopup() {
    document.getElementById('add-link-popup').style.display = 'flex';
}

function hideAddLinkPopup() {
    document.getElementById('add-link-popup').style.display = 'none';
}

async function saveLink() {
    const name = document.getElementById('link-name').value.trim();
    const url = document.getElementById('link-url').value.trim();
    if (name && url) {
        try {
            await window.electron.addLink({ name, url });
            fetchLinks();
            hideAddLinkPopup();
        } catch (error) {
            console.error('Error saving link:', error);
        }
    } else {
        alert('Please enter both a name and a URL.');
    }
}

document.getElementById('add-link-button').addEventListener('click', showAddLinkPopup);
document.getElementById('save-link-button').addEventListener('click', saveLink);
document.getElementById('cancel-link-button').addEventListener('click', hideAddLinkPopup);

function startLiveUpdate() {
    setInterval(async () => {
        try {
            const systemVariables = await window.electron.getSystemVariables();

            // Update hours since last reset
            const hoursSinceResetElement = document.getElementById('hours-since-reset');
            if (hoursSinceResetElement && systemVariables.lastTimeSessionReset) {
                const currentUnixTimestamp = Math.floor(Date.now() / 1000);
                const secondsSinceReset = currentUnixTimestamp - systemVariables.lastTimeSessionReset;
                const hoursSinceReset = Math.floor(secondsSinceReset / 3600); // Round down to the nearest hour
                hoursSinceResetElement.textContent = `${hoursSinceReset} hours`;
            }
        } catch (error) {
            console.error('Error updating live data:', error);
        }
    }, 1000 * 60); // Update every minute
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
            <div class="assignment-row">
                <div class="variable-box">${assignment.course}</div>
                <div class="variable-box">${assignment.name}</div>
                <div class="variable-box">${new Date(assignment.dueDate * 1000).toLocaleDateString()}</div>
                <div class="variable-box">${(assignment.workedSeconds / 60).toFixed(2)} mins</div>
            </div>
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
                logSessionTime(workDuration); // Log time for the session
                resetTimer();
            }
        }, 1000);

        button.textContent = 'Stop Working';
        button.classList.add('stop');
    } else {
        // Stop timer
        clearInterval(timerInterval);
        
        // Calculate remaining time and log it
        const timeWorked = workDuration - parseInt(timeRemaining.textContent.split(':').reduce((acc, time) => (60 * acc) + +time), 10);
        logWorkTime(timeWorked); // Log the time worked for the assignment
        logSessionTime(timeWorked); // Log the time for the session
        resetTimer();
    }
}

function showEditSessionPopup() {
    const popup = document.getElementById('edit-session-popup');
    const input = document.getElementById('session-duration-input');

    // Fetch the currently displayed session duration
    input.value = document.getElementById('session-duration').textContent;
    popup.style.display = 'flex';
}

function hideEditSessionPopup() {
    const popup = document.getElementById('edit-session-popup');
    popup.style.display = 'none';
}

document.getElementById('save-session-duration-button').addEventListener('click', () => {
    const input = document.getElementById('session-duration-input').value;
    const [hours, minutes, seconds] = input.split(':').map(Number);
    if (!isNaN(hours) && !isNaN(minutes) && !isNaN(seconds)) {
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        updateSessionDuration(totalSeconds);
        hideEditSessionPopup();
    } else {
        alert('Invalid time format. Please use hours:minutes:seconds.');
    }
});

document.getElementById('cancel-session-duration-button').addEventListener('click', hideEditSessionPopup);
document.getElementById('edit-session-duration-button').addEventListener('click', showEditSessionPopup);

document.getElementById('reset-session-button').addEventListener('click', async () => {
    try {

        // Reset the lastTimeSessionReset in system_variables.json
        const systemVariables = await window.electron.getSystemVariables();
        const currentTimestamp = Math.floor(Date.now() / 1000); // Get current Unix timestamp
        await window.electron.updateSystemVariables({
            ...systemVariables,
            lastTimeSessionReset: currentTimestamp, // Update lastTimeSessionReset
        });
        
        // Clear the current session work time data
        await window.electron.clearSessionWorkTime();

        // Execute the algorithm
        const result = await window.electron.executeAlgorithm();
        if (result.success) {
            alert('Session reset and priorities updated successfully!');
        } else {
            throw new Error(result.error || 'Unknown error occurred');
        }

        // Refresh the UI to reflect the reset
        const timeLoggedElement = document.getElementById('time-logged');
        if (timeLoggedElement) {
            timeLoggedElement.textContent = formatSessionTime(0); // Set UI to 00:00:00
        }

        fetchData(); // Refresh the UI after resetting
        alert('Session time reset successfully!');
    } catch (error) {
        console.error('Error resetting session time:', error);
        alert('Failed to reset session time.');
    }
});


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

function formatSessionTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours)}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

async function logSessionTime(secondsWorked) {
    if (selectedAssignmentId === null) {
        console.error('No assignment selected. Cannot log session time.');
        return;
    }

    try {
        const sessionWorkTime = await window.electron.getSessionWorkTime();
        const existingAssignment = sessionWorkTime.find(item => item.assignmentId === selectedAssignmentId);

        if (existingAssignment) {
            existingAssignment.timeWorked += secondsWorked;
        } else {
            sessionWorkTime.push({ assignmentId: selectedAssignmentId, timeWorked: secondsWorked });
        }

        await window.electron.updateSessionWorkTime(sessionWorkTime);
        console.log('Session time logged successfully:', sessionWorkTime);
    } catch (error) {
        console.error('Error updating session work time:', error);
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
            // Use the local time zone to construct the Date object
            const [year, month, day] = popupDueDate.split('-').map(Number);
            const unixTimestamp = Math.floor(new Date(year, month - 1, day).getTime() / 1000); // Convert to Unix timestamp in local time zone // lowest unix unit is seconds
            const result = await window.electron.editAssignment(assignment.id, unixTimestamp);

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
            // Use the local time zone to construct the Date object
            const [year, month, day] = dueDate.split('-').map(Number);
            const unixTimestamp = Math.floor(new Date(year, month - 1, day).getTime() / 1000); // Convert to Unix timestamp in local time zone // lowest unix unit is seconds
            // Pass the selected as Unix timestamp
            await window.electron.addAssignment(course, name, unixTimestamp);
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