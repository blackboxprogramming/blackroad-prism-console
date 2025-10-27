const { ipcRenderer } = require('electron');

function setAppContent(appData) {
  const title = document.getElementById('windowTitle');
  const placeholder = document.getElementById('appPlaceholder');

  if (appData?.name) {
    title.textContent = `${appData.name}`;
    placeholder.textContent = `${appData.name} experience coming soon`; 
  } else {
    title.textContent = 'Black Road App';
    placeholder.textContent = 'Application loading...';
  }
}

document.getElementById('minimizeWindow').addEventListener('click', () => {
  ipcRenderer.send('minimize-window');
});

document.getElementById('maximizeWindow').addEventListener('click', () => {
  ipcRenderer.send('maximize-window');
});

document.getElementById('closeWindow').addEventListener('click', () => {
  ipcRenderer.send('close-window');
});

ipcRenderer.on('app-data', (_event, appData) => {
  setAppContent(appData);
});
