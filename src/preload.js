const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    fetchData: () => ipcRenderer.invoke('fetchData'),
    addCourse: (courseName) => ipcRenderer.invoke('addCourse', courseName),
    addAssignment: (course, name, dueDate) => ipcRenderer.invoke('addAssignment', course, name, dueDate),
    deleteAssignment: (id) => ipcRenderer.invoke('deleteAssignment', id),
    editAssignment: (id, newDueDate) => ipcRenderer.invoke('editAssignment', id, newDueDate),
    saveAssignmentTime: (id, additionalSeconds) => ipcRenderer.invoke('saveAssignmentTime', id, additionalSeconds),
});