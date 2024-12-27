const fs = require('fs');
const userVariables = require('./user_variables_algorithm');
const systemVariables = require('./system_variables_algorithm');
const readlineSync = require('readline-sync');

// Helper function for console logging with timestamps
function logWithTimestamp(message, data = null) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    if (data !== null) {
        console.log(JSON.stringify(data, null, 2));
    }
}

// Trapezoidal rule implementation
function trapezoidalRule(t0, t1, params, allAssignments) {
    const deltaT = 1; // Step size in seconds
    const totalShares = new Array(allAssignments.length).fill(0); // Track total shares for each assignment

    // Loop through each slice
    for (let t = t0; t < t1; t += deltaT) {
        // Compute f(t) for all assignments in this slice
        const fTValues = allAssignments.map((assignment) =>
            calculateFT(t, assignment, params)
        );

        // Find f_min for this slice
        const fMin = Math.min(...fTValues);

        // Adjust all f(t) values by adding 2 * |f_min| to ensure non-zero shares
        const adjustedFT = fTValues.map((f_t) => f_t + 2 * Math.abs(fMin));

        // Compute total sum of adjusted f(t) values for this slice
        const totalAdjustedFTSum = adjustedFT.reduce((total, value) => total + value, 0);

        // Compute proportions (share of the second) for each assignment
        const proportions = adjustedFT.map((value) => value / totalAdjustedFTSum);

        // Add each proportion (share of the second) to the corresponding total
        proportions.forEach((proportion, index) => {
            totalShares[index] += proportion * deltaT; // Add the share for this second
        });
    }

    // Return the total shares for all assignments
    return totalShares;
}


function calculateFT(t, assignment, params) {
    const { k, Tmax, muDueTimes, sigmaDueTimes, muLoggedTimes, sigmaLoggedTimes } = params;
    const { dueDate: D, workedSeconds: loggedTime } = assignment;

    const expTerm = (1 - Math.exp(-k * (Tmax - (D - t)) / Tmax)) / (1 - Math.exp(-k));
    const firstTerm = (0.5 + 0.5 * expTerm) * (muDueTimes - (D - t)) / sigmaDueTimes;
    const secondTerm = (0.5 - 0.5 * expTerm) * (muLoggedTimes - loggedTime) / sigmaLoggedTimes;

    return firstTerm + secondTerm;
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
const rawData = fs.readFileSync('../db/assignments.json', 'utf8');
const assignments = JSON.parse(rawData);

const tMaxVal = calculateTmax(assignments, userVariables.minimumTmax);
const t0 = systemVariables.t0;
const t1 = getCurrentUnixTime();

const meanDueDate = calculateMeanForKey(assignments, "dueDate", t1);
const standardDeviationDueDates = calculateStandardDeviationForKey(assignments, "dueDate", meanDueDate, t1);
const meanWorkedSeconds = calculateMeanForKey(assignments, "workedSeconds", t1);
const standardDeviationWorkedSeconds = calculateStandardDeviationForKey(assignments, "workedSeconds", meanWorkedSeconds, t1);

const params = {
    k: userVariables.k,
    Tmax: tMaxVal,
    muDueTimes: meanDueDate,
    sigmaDueTimes: standardDeviationDueDates,
    muLoggedTimes: meanWorkedSeconds,
    sigmaLoggedTimes: standardDeviationWorkedSeconds,
};

const totalShares = trapezoidalRule(t0, t1, params, assignments);

// Log cumulative totals for each assignment
assignments.forEach((assignment, index) => {
    logWithTimestamp(`Total shares for assignment ${index + 1}`, { totalShare: totalShares[index] });
});

// Log verification of the total sum
const expectedTotal = t1 - t0;
const totalPrioritySum = totalShares.reduce((sum, share) => sum + share, 0);
logWithTimestamp("Verification of Total Priorities", {
    totalPrioritySum,
    expectedTotal,
    matches: Math.abs(totalPrioritySum - expectedTotal) < 1e-6, // Check if they are approximately equal
});

// // Log the totalShares array
// logWithTimestamp("Total shares array output", totalShares);

// // Find the three assignments with the greatest shares
// const top3Assignments = totalShares
//     .map((share, index) => ({ index: index + 1, share }))
//     .sort((a, b) => b.share - a.share) // Sort descending by share
//     .slice(0, 3); // Get the top 3

// // Log the top 3 assignments
// logWithTimestamp("Top 3 assignments with greatest shares", top3Assignments);