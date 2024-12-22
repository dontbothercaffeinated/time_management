const fs = require('fs');
const userVariables = require('./user_variables_algorithm');
const systemVariables = require('./system_variables_algorithm');
const readlineSync = require('readline-sync');

// Helper function for detailed logging to file
function logToFile(data, filename = 'assignment_logs.json') {
    fs.writeFileSync(filename, JSON.stringify(data, null, 2));
}

// Helper function for console logging with timestamps
function logWithTimestamp(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data !== null) {
        console.log(JSON.stringify(data, null, 2));
    }
}

// Trapezoidal rule implementation
function trapezoidalRule(t0, t1, params, allAssignments) {
    const { k, Tmax, D, muDueTimes, sigmaDueTimes, muLoggedTimes, sigmaLoggedTimes, loggedTime } = params;

    const deltaT = 1; // Step size in seconds
    let sum = 0;
    const detailedLogs = []; // Collect logs for each slice

    for (let t = t0; t < t1; t += deltaT) {
        // Calculate total f(t) sum across all assignments
        const totalFT = allAssignments.reduce((total, assignmentParams) => {
            return total + priorityFunction(t, assignmentParams, 1); // Use unnormalized f(t)
        }, 0);

        // Calculate normalized f(t) for this assignment
        const f_t = priorityFunction(t, params, totalFT);
        const f_tNext = priorityFunction(t + deltaT, params, totalFT);
        sum += (f_t + f_tNext) / 2 * deltaT;

        // Add intermediate calculations to detailed logs
        detailedLogs.push({
            t,
            f_t,
            f_tNext,
            partialSum: sum,
            totalFT,
        });
    }

    // Write detailed logs to file
    logToFile(detailedLogs);

    return sum;
}

// Priority function
function priorityFunction(t, params, totalFT) {
    const { k, Tmax, D, muDueTimes, sigmaDueTimes, muLoggedTimes, sigmaLoggedTimes, loggedTime } = params;

    // Original priority calculation
    const expTerm = (1 - Math.exp(-k * (Tmax - (D - t)) / Tmax)) / (1 - Math.exp(-k));
    const firstTerm = (0.5 + 0.5 * expTerm) * ((D - t) - muDueTimes) / sigmaDueTimes;
    const secondTerm = (0.5 - 0.5 * expTerm) * (loggedTime - muLoggedTimes) / sigmaLoggedTimes;
    const result = firstTerm + secondTerm;

    // Normalize by total sum
    return result / totalFT;
}

// Calculate mean
function calculateMeanForKey(assignments, key, currentTime) {
    if (key === "dueDate") {
        const secondsUntilDue = assignments.map((assignment) => assignment.dueDate - currentTime);
        return secondsUntilDue.reduce((sum, value) => sum + value, 0) / secondsUntilDue.length;
    } else {
        const values = assignments.map((assignment) => assignment[key]);
        return values.reduce((sum, value) => sum + value, 0) / values.length;
    }
}

// Calculate standard deviation
function calculateStandardDeviationForKey(assignments, key, mean, currentTime) {
    if (key === "dueDate") {
        const secondsUntilDue = assignments.map((assignment) => assignment.dueDate - currentTime);
        const squaredDifferences = secondsUntilDue.map((value) => Math.pow(value - mean, 2));
        const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / secondsUntilDue.length;
        return Math.sqrt(variance);
    } else {
        const values = assignments.map((assignment) => assignment[key]);
        const squaredDifferences = values.map((value) => Math.pow(value - mean, 2));
        const variance = squaredDifferences.reduce((sum, value) => sum + value, 0) / values.length;
        return Math.sqrt(variance);
    }
}

// Get current Unix time
function getCurrentUnixTime() {
    return Math.floor(Date.now() / 1000); // Converts milliseconds to seconds
}

// Calculate Tmax
function calculateTmax(assignments, minTmax) {
    const currentTime = getCurrentUnixTime();
    const secondsUntilDue = assignments.map((assignment) => assignment.dueDate - currentTime);
    const meanSecondsUntilDue = secondsUntilDue.reduce((sum, value) => sum + value, 0) / secondsUntilDue.length;
    return Math.max(minTmax, meanSecondsUntilDue);
}

// Main script execution
const rawData = fs.readFileSync('./test_data.json', 'utf8');
const assignments = JSON.parse(rawData);

const tMaxVal = calculateTmax(assignments, userVariables.minimumTmax);
const t0 = systemVariables.t0;
const t1 = getCurrentUnixTime();

const meanDueDate = calculateMeanForKey(assignments, "dueDate", t1);
const standardDeviationDueDates = calculateStandardDeviationForKey(assignments, "dueDate", meanDueDate, t1);
const meanWorkedSeconds = calculateMeanForKey(assignments, "workedSeconds", t1);
const standardDeviationWorkedSeconds = calculateStandardDeviationForKey(assignments, "workedSeconds", meanWorkedSeconds, t1);

let totalPrioritySum = 0; // To track the total sum of normalized priorities

assignments.forEach((assignment, index) => {
    logWithTimestamp(`Processing assignment ${index + 1}`, assignment);

    const params = {
        k: userVariables.k,
        Tmax: tMaxVal,
        D: assignment.dueDate,
        muDueTimes: meanDueDate,
        sigmaDueTimes: standardDeviationDueDates,
        muLoggedTimes: meanWorkedSeconds,
        sigmaLoggedTimes: standardDeviationWorkedSeconds,
        loggedTime: assignment.workedSeconds,
    };

    // Log all parameters for the current assignment
    logWithTimestamp(`Parameters for assignment ${index + 1}`, {
        ...params,
        t0,
        t1,
    });    

    // Clear previous detailed logs by overwriting the file
    fs.writeFileSync('assignment_logs.json', '[]');


    // Start the timer
    const startTime = Date.now();

    // Perform trapezoidal rule calculation and log detailed steps to file
    const result = trapezoidalRule(t0, t1, params, assignments.map((a) => ({
        k: userVariables.k,
        Tmax: tMaxVal,
        D: a.dueDate,
        muDueTimes: meanDueDate,
        sigmaDueTimes: standardDeviationDueDates,
        muLoggedTimes: meanWorkedSeconds,
        sigmaLoggedTimes: standardDeviationWorkedSeconds,
        loggedTime: a.workedSeconds,
    })));

    // Stop the timer and calculate the elapsed time
    const elapsedTime = (Date.now() - startTime) / 1000; // Convert milliseconds to seconds

    // Add the result to the total priority sum
    totalPrioritySum += result;

    // Log final result to console
    logWithTimestamp(`Finished processing assignment ${index + 1}`, { result });
    logWithTimestamp(`Time taken for assignment ${index + 1}:`, { elapsedTime: `${elapsedTime.toFixed(2)} seconds` });

    readlineSync.question('Press Enter to continue...');
});

// At the end, log verification of the total sum
const expectedTotal = t1 - t0;
logWithTimestamp("Verification of Total Priorities", {
    totalPrioritySum,
    expectedTotal,
    matches: Math.abs(totalPrioritySum - expectedTotal) < 1e-6, // Check if they are approximately equal
});