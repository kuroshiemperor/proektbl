// Tab navigation
function openTab(tabName) {
    // Hide all tab content
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }

    // Remove active class from all tab buttons
    const tabButtons = document.getElementsByClassName('tab-button');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }

    // Show the specific tab content and activate the button
    document.getElementById(tabName).classList.add('active');
    event.currentTarget.classList.add('active');

    // Load users if users tab is opened
    if (tabName === 'users') {
        loadUsers();
    }
}

// Registration form
document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const data = {
        name: formData.get('name'),
        email: formData.get('email')
    };

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        const messageDiv = document.getElementById('registerMessage');
        if (response.ok) {
            messageDiv.className = 'message success';
            messageDiv.textContent = result.message;
            this.reset();
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = result.error;
        }
    } catch (error) {
        console.error('Error:', error);
        const messageDiv = document.getElementById('registerMessage');
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Произошла ошибка при регистрации';
    }
});

// Meeting form
document.getElementById('meetingForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const participants = formData.get('participants')
        .split(',')
        .map(email => email.trim())
        .filter(email => email);

    const data = {
        title: formData.get('title'),
        description: formData.get('description'),
        date: formData.get('date'),
        time: formData.get('time'),
        organizer: formData.get('organizer'),
        participants: participants
    };

    try {
        const response = await fetch('/api/create-meeting', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();
        
        const messageDiv = document.getElementById('meetingMessage');
        if (response.ok) {
            messageDiv.className = 'message success';
            messageDiv.textContent = result.message;
            this.reset();
        } else {
            messageDiv.className = 'message error';
            messageDiv.textContent = result.error;
        }
    } catch (error) {
        console.error('Error:', error);
        const messageDiv = document.getElementById('meetingMessage');
        messageDiv.className = 'message error';
        messageDiv.textContent = 'Произошла ошибка при создании встречи';
    }
});

// Load users
async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        
        const usersList = document.getElementById('usersList');
        
        if (users.length === 0) {
            usersList.innerHTML = '<p>Нет зарегистрированных пользователей</p>';
            return;
        }
        
        usersList.innerHTML = users.map(user => `
            <div class="user-item">
                <div>
                    <strong>${user.name}</strong>
                    <div class="user-email">${user.email}</div>
                </div>
                <small>Зарегистрирован: ${new Date(user.registeredAt).toLocaleDateString()}</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersList').innerHTML = '<p>Ошибка загрузки пользователей</p>';
    }
}

// Set minimum date to today for meeting date
document.getElementById('meetingDate').min = new Date().toISOString().split('T')[0];

// Load users on page load if users tab is active
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('users').classList.contains('active')) {
        loadUsers();
    }
});