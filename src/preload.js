const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    fetchData: async () => {
        try {
            const data = await ipcRenderer.invoke('fetchData');
            console.log('Data received from main process:', data);
            return data;
        } catch (error) {
            console.error('Error fetching data from main process:', error);
        }
    },
    addCourse: async (courseName) => {
        try {
            await ipcRenderer.invoke('addCourse', courseName);
            console.log(`Course added: ${courseName}`);
        } catch (error) {
            console.error('Error adding course:', error);
        }
    },
    addAssignment: async (course, name, dueDate) => {
        try {
            await ipcRenderer.invoke('addAssignment', course, name, dueDate);
            console.log(`Assignment added: ${name} for course ${course}`);
        } catch (error) {
            console.error('Error adding assignment:', error);
        }
    },
    saveAssignmentTime: async (assignmentId, additionalSeconds) => {
        try {
            await ipcRenderer.invoke('saveAssignmentTime', assignmentId, additionalSeconds);
            console.log(`Time logged for assignment ID ${assignmentId}: ${additionalSeconds} seconds`);
        } catch (error) {
            console.error('Error saving time for assignment:', error);
        }
    }
});