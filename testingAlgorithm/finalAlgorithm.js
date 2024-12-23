const fs = require('fs');
const userVariables = require('./user_variables_algorithm');
const systemVariables = require('./system_variables_algorithm');
const readlineSync = require('readline-sync');

// File for logging
const logFile = 'assignment_logs.json';

// Helper function for detailed logging to file
function appendToFile(data, filename) {
    fs.appendFileSync(filename, JSON.stringify(data, null, 2) + '\n');
}

// Helper function for console logging with timestamps
function logWithTimestamp(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    if (data !== null) {
        console.log(JSON.stringify(data, null, 2));
    }
    // Write to the log file
    appendToFile({ timestamp, message, data }, logFile);
}

// Trapezoidal rule implementation
function trapezoidalRule(t0, t1, params, allAssignments) {
    const deltaT = 1; // Step size in seconds
    let sum = 0;
    const detailedLogs = []; // Collect logs for each slice

    for (let t = t0; t < t1; t += deltaT) {
        // Calculate adjusted f(t) values for all assignments
        const adjustedFTs = allAssignments.map((assignment) => {
            return priorityFunction(t, assignment, allAssignments);
        });

        // Calculate total adjusted f(t) sum across all assignments
        const totalAdjustedFT = adjustedFTs.reduce((total, value) => total + value, 0);

        // Calculate normalized f'(t) for this assignment
        const f_t = priorityFunction(t, params, allAssignments) / totalAdjustedFT;
        const f_tNext = priorityFunction(t + deltaT, params, allAssignments) / totalAdjustedFT;

        // Apply trapezoidal rule
        sum += (f_t + f_tNext) / 2 * deltaT;

        // Add intermediate calculations to detailed logs
        detailedLogs.push({
            t,
            f_t,
            f_tNext,
            partialSum: sum,
            totalAdjustedFT,
        });
    }

    return sum;
}

// Priority function
function priorityFunction(t, params, allAssignments) {
    const { k, Tmax, D, muDueTimes, sigmaDueTimes, muLoggedTimes, sigmaLoggedTimes, loggedTime } = params;

    // Original priority calculation for f(t)
    const expTerm = (1 - Math.exp(-k * (Tmax - (D - t)) / Tmax)) / (1 - Math.exp(-k));
    const firstTerm = (0.5 + 0.5 * expTerm) * (muDueTimes - (D - t)) / sigmaDueTimes;
    const secondTerm = (0.5 - 0.5 * expTerm) * (muLoggedTimes - loggedTime) / sigmaLoggedTimes;
    const f_t = firstTerm + secondTerm;

    // Calculate f_min across all assignments
    const f_min = Math.min(
        ...allAssignments.map((assignment) => {
            const expTermA = (1 - Math.exp(-k * (Tmax - (assignment.D - t)) / Tmax)) / (1 - Math.exp(-k));
            const firstTermA = (0.5 + 0.5 * expTermA) * (muDueTimes - (assignment.D - t)) / sigmaDueTimes;
            const secondTermA = (0.5 - 0.5 * expTermA) * (muLoggedTimes - assignment.loggedTime) / sigmaLoggedTimes;
            return firstTermA + secondTermA;
        })
    );

    // Normalize f(t) using f_min
    const adjusted_f_t = f_t + Math.abs(f_min);
    return adjusted_f_t;
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
});

// At the end, log verification of the total sum
const expectedTotal = t1 - t0;
logWithTimestamp("Verification of Total Priorities", {
    totalPrioritySum,
    expectedTotal,
    matches: Math.abs(totalPrioritySum - expectedTotal) < 1e-6, // Check if they are approximately equal
});