function handleLogin(event) {
  event.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (username && password) {
    window.location.href = 'index.html';
  } else {
    alert('Please enter both username and password.');
  }
}
