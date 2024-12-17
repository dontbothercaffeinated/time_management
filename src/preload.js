const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    // Course Methods
    fetchData: () => ipcRenderer.invoke('fetchData'),
    addCourse: (courseName) => ipcRenderer.invoke('addCourse', courseName),
    deleteCourse: async (courseName) => {
        return await ipcRenderer.invoke('deleteCourse', courseName);
    },

    // Assignment Methods
    addAssignment: (course, name, dueDate) =>
        ipcRenderer.invoke('addAssignment', course, name, dueDate),
    deleteAssignment: (assignmentId) =>
        ipcRenderer.invoke('deleteAssignment', assignmentId),
    editAssignment: (assignmentId, newDueDate) =>
        ipcRenderer.invoke('editAssignment', assignmentId, newDueDate),

    
    logTime: (assignmentId, secondsWorked) =>
        ipcRenderer.invoke('log-time', assignmentId, secondsWorked),
});