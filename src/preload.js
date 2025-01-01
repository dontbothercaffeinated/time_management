const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    executeAlgorithm: async () => await ipcRenderer.invoke('execute-algorithm'),

    // Course Methods
    fetchData: async () => await ipcRenderer.invoke('fetchData'),
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
    
    getSystemVariables: async () => await ipcRenderer.invoke('getSystemVariables'),
    updateSystemVariables: async (data) => await ipcRenderer.invoke('updateSystemVariables', data),
    getSessionWorkTime: async () => await ipcRenderer.invoke('getSessionWorkTime'),
    updateSessionWorkTime: async (data) => await ipcRenderer.invoke('updateSessionWorkTime', data),
    clearSessionWorkTime: async () => await ipcRenderer.invoke('clearSessionWorkTime'),
    getLinks: async () => await ipcRenderer.invoke('getLinks'),
    addLink: async (link) => await ipcRenderer.invoke('addLink', link),
    openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),
    updateLinks: async (links) => await ipcRenderer.invoke('updateLinks', links),
});