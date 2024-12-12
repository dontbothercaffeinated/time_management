const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
    fetchData: () => ipcRenderer.invoke('fetchData'),
    addCourse: (course) => ipcRenderer.invoke('addCourse', course),
    addAssignment: (course, name, dueDate) => ipcRenderer.invoke('addAssignment', course, name, dueDate),
});