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
    const rawTotals = new Array(allAssignments.length).fill(0); // Track cumulative raw priority scores for each assignment

    const n = allAssignments.length; // Total number of assignments
    const priorityAmplificationFactor = userVariables.priorityAmplificationFactor; // Custom base for logarithm (e.g., base 0.5 for more amplification)

    // Validate `priorityAmplificationFactor`
    if (typeof priorityAmplificationFactor !== 'number' || priorityAmplificationFactor <= 1) {
        throw new Error("priorityAmplificationFactor must be a number greater than 1.");
    }

    const logN = Math.log(n) / Math.log(priorityAmplificationFactor); // Compute log(n) with custom base

    // Loop through each slice
    for (let t = t0; t < t1; t += deltaT) {
        // Compute f(t) for all assignments in this slice
        const fTValues = allAssignments.map((assignment) =>
            calculateFT(t, assignment, params).priority
        );

        // Adjust fTValues to make them non-negative
        const fMin = Math.min(...fTValues);
        const adjustedFT = fTValues.map((f_t) => f_t + 2 * Math.abs(fMin));

        // Raise each adjusted priority score to the power of log(n)
        const amplifiedFT = adjustedFT.map((f_t) => Math.pow(f_t, logN));

        // Accumulate adjusted priority scores for each assignment
        amplifiedFT.forEach((value, index) => {
        rawTotals[index] += value; // Add adjusted priority score for this second
        });
    }

    // Normalize cumulative raw priority scores to calculate proportions
    const totalRawScore = rawTotals.reduce((sum, value) => sum + value, 0);
    const totalShares = rawTotals.map((value) => (value / totalRawScore) * (t1 - t0)); // Proportional shares of total time elapsed

    return totalShares;
}


function calculateFT(t, assignment, params) {
    const { k, Tmax, muDueTimes, sigmaDueTimes, muLoggedTimes, sigmaLoggedTimes } = params;
    const { dueDate: D, workedSeconds: loggedTime } = assignment;

    const timeUntilDue = D - t; // Time remaining until due date

    let weightDueTime, weightLoggedTime;

    if (timeUntilDue > Tmax) {
        weightDueTime = 1; // Outside Tmax: Both weights are 1
        weightLoggedTime = 1;
    } else {
        const percentTmaxRemaining = timeUntilDue / Tmax; // % of Tmax remaining
        const expTerm = Math.exp(-k * (1 - percentTmaxRemaining)); // Exponential term
    
        // Ensure weights transition correctly
        weightDueTime = 1 + (1 - expTerm); // Starts at 1, grows to 2
        weightLoggedTime = expTerm; // Starts at 1, decays to 0
    }

    const dueTimeZScore = (muDueTimes - timeUntilDue) / sigmaDueTimes;
    const loggedTimeZScore = (muLoggedTimes - loggedTime) / sigmaLoggedTimes;

    const priority = weightDueTime * dueTimeZScore + weightLoggedTime * loggedTimeZScore;

    return { dueTimeZScore, loggedTimeZScore, priority };
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
    // Always return the minimumTmax value
    return minTmax;
}

// Main script execution
const rawData = fs.readFileSync('../db/assignments.json', 'utf8');
const assignments = JSON.parse(rawData);

const tMaxVal = calculateTmax(assignments, userVariables.minimumTmax);
const t0 = systemVariables.t0;
const t1 = getCurrentUnixTime();
const totalTimeElapsed = t1 - t0;

console.log(`Tmax: ${tMaxVal}`);
console.log(`t0: ${t0}`);
console.log(`t1: ${t1}`);
console.log(`Total time elapsed (t1 - t0): ${totalTimeElapsed} seconds`);

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

assignments.forEach((assignment, index) => {
    console.log(`Assignment: ${assignment.name}`);
    console.log(`  Total Shares: ${totalShares[index].toFixed(3)}`);
});

// Log cumulative totals for each assignment
assignments.forEach((assignment) => {
    const { dueTimeZScore, loggedTimeZScore, priority } = calculateFT(t1, assignment, params);
    console.log(`Assignment: ${assignment.name}`);
    console.log(`  Average Due Time Z-Score: ${dueTimeZScore.toFixed(3)}`);
    console.log(`  Logged Time Z-Score: ${loggedTimeZScore.toFixed(3)}`);
    console.log(`  Priority: ${priority.toFixed(3)}`);
});

console.log("\nSummary:");
console.log(`Tmax: ${tMaxVal}`);
console.log(`t0: ${t0}`);
console.log(`t1: ${t1}`);
console.log(`Total time elapsed (t1 - t0): ${totalTimeElapsed} seconds`);


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