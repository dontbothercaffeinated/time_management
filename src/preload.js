const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    deleteCourse: (courseName) => ipcRenderer.invoke('deleteCourse', courseName),
    fetchData: () => ipcRenderer.invoke('fetchData'),
    addCourse: (courseName) => ipcRenderer.invoke('addCourse', courseName),
    addAssignment: (course, name, dueDate) => ipcRenderer.invoke('addAssignment', course, name, dueDate),
    deleteAssignment: (assignmentId) => ipcRenderer.invoke('deleteAssignment', assignmentId),
});

contextBridge.exposeInMainWorld('electron', {
    deleteCourse: async (courseName) => {
        return await ipcRenderer.invoke('deleteCourse', courseName);
    },
});
