const darkModeToggle = document.getElementById('darkModeToggle');

// Check for saved preference
if (localStorage.getItem('darkMode') === 'enabled') {
    document.documentElement.setAttribute('data-bs-theme', 'dark');
    darkModeToggle.checked = true;
}

darkModeToggle.addEventListener('change', () => {
    if (darkModeToggle.checked) {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        document.documentElement.setAttribute('data-bs-theme', 'light');
        localStorage.setItem('darkMode', null);
    }
});
