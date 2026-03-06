// ==================== Admin Panel JavaScript ====================

// Initialisiere das Benutzer-System bei erstem Laden
function initializeUserSystem() {
  const storedUsers = localStorage.getItem('adminUsers');
  if (!storedUsers) {
    const defaultUsers = {
      'carlos': {
        password: '1234',
        canCreateUsers: true
      }
    };
    localStorage.setItem('adminUsers', JSON.stringify(defaultUsers));
  }
}

// Benutzer-Info abrufen
function getUserInfo(username) {
  const users = JSON.parse(localStorage.getItem('adminUsers') || '{}');
  return users[username];
}

// Passwort ändern
function changePassword(username, newPassword) {
  const users = JSON.parse(localStorage.getItem('adminUsers') || '{}');
  if (users[username]) {
    users[username].password = newPassword;
    localStorage.setItem('adminUsers', JSON.stringify(users));
    return true;
  }
  return false;
}

// Neuen Benutzer hinzufügen
function addUser(username, password, isSuperAdmin = false) {
  const users = JSON.parse(localStorage.getItem('adminUsers') || '{}');
  if (users[username]) {
    return false; // Benutzer existiert bereits
  }
  users[username] = {
    password: password,
    canCreateUsers: isSuperAdmin
  };
  localStorage.setItem('adminUsers', JSON.stringify(users));
  return true;
}

// Benutzer löschen
function deleteUser(username) {
  const users = JSON.parse(localStorage.getItem('adminUsers') || '{}');
  if (username === 'carlos') {
    return false; // carlos kann nicht gelöscht werden
  }
  if (users[username]) {
    delete users[username];
    localStorage.setItem('adminUsers', JSON.stringify(users));
    return true;
  }
  return false;
}

// Alle Benutzer abrufen
function getAllUsers() {
  return JSON.parse(localStorage.getItem('adminUsers') || '{}');
}

// ==================== DOM Ready ====================
document.addEventListener('DOMContentLoaded', function() {
  initializeUserSystem();

  // Check if user is logged in
  const currentUser = localStorage.getItem('currentAdminUser');
  
  if (!currentUser) {
    alert('Du musst angemeldet sein um auf diese Seite zuzugreifen!');
    window.location.href = 'Untitled-1.html';
    return;
  }

  // Get user info
  let userInfo = getUserInfo(currentUser);
  if (!userInfo) {
    alert('Benutzer nicht gefunden!');
    window.location.href = 'Untitled-1.html';
    return;
  }

  // ==================== UI Updates ====================
  // Update welcome message and header
  document.getElementById('welcomeUsername').textContent = currentUser;
  document.getElementById('currentUserDisplay').textContent = currentUser;

  // Show user management only for users with create permissions
  if (userInfo.canCreateUsers) {
    document.getElementById('userManagementBox').style.display = 'block';
  }

  // ==================== Modal Elements ====================
  const changePasswordModal = document.getElementById('changePasswordModal');
  const userManagementModal = document.getElementById('userManagementModal');
  const changePasswordBtn = document.getElementById('changePasswordBtn');
  const manageUsersBtn = document.getElementById('manageUsersBtn');
  const closePasswordModal = document.getElementById('closePasswordModal');
  const closeUserManagementModal = document.getElementById('closeUserManagementModal');
  const changePasswordForm = document.getElementById('changePasswordForm');
  const addUserForm = document.getElementById('addUserForm');
  const logoutBtn = document.getElementById('logoutBtn');

  // ==================== Change Password ====================
  if (changePasswordBtn) {
    changePasswordBtn.addEventListener('click', function() {
      changePasswordModal.classList.add('show');
    });
  }

  if (closePasswordModal) {
    closePasswordModal.addEventListener('click', function() {
      changePasswordModal.classList.remove('show');
      changePasswordForm.reset();
    });
  }

  if (changePasswordForm) {
    changePasswordForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

      // Validate current password
      if (userInfo.password !== currentPassword) {
        alert('Aktuelles Passwort ist falsch!');
        return;
      }

      // Validate new password
      if (newPassword.length < 4) {
        alert('Das neue Passwort muss mindestens 4 Zeichen lang sein!');
        return;
      }

      // Validate confirmation
      if (newPassword !== confirmPassword) {
        alert('Passwörter stimmen nicht überein!');
        return;
      }

      // Change password
      if (changePassword(currentUser, newPassword)) {
        // reload userInfo from storage so future checks use updated password
        userInfo = getUserInfo(currentUser);
        alert('Passwort erfolgreich geändert!');
        changePasswordModal.classList.remove('show');
        changePasswordForm.reset();
      } else {
        alert('Fehler beim Ändern des Passworts!');
      }
    });
  }

  // ==================== Close modals on outside click ====================
  window.addEventListener('click', function(event) {
    if (event.target === changePasswordModal) {
      changePasswordModal.classList.remove('show');
      changePasswordForm.reset();
    }
    if (event.target === userManagementModal) {
      userManagementModal.classList.remove('show');
      addUserForm.reset();
    }
  });

  // ==================== User Management ====================
  if (manageUsersBtn) {
    manageUsersBtn.addEventListener('click', function() {
      userManagementModal.classList.add('show');
      renderUsersList();
    });
  }

  if (closeUserManagementModal) {
    closeUserManagementModal.addEventListener('click', function() {
      userManagementModal.classList.remove('show');
      addUserForm.reset();
    });
  }

  // Render users list
  function renderUsersList() {
    const usersList = document.getElementById('usersList');
    const users = getAllUsers();
    
    usersList.innerHTML = '';

    Object.entries(users).forEach(([username, userData]) => {
      const userItem = document.createElement('div');
      userItem.className = 'user-item';
      
      const userInfo = document.createElement('div');
      userInfo.className = 'user-info';
      userInfo.innerHTML = `
        <div class="user-name">${username}</div>
        <div class="user-badge">${userData.canCreateUsers ? '👑 Super Admin' : '👤 Admin'}</div>
      `;
      
      const userActions = document.createElement('div');
      userActions.className = 'user-actions';
      
      // Delete button (only for non-carlos users and not self)
      if (username !== 'carlos' && username !== currentUser) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Löschen';
        deleteBtn.addEventListener('click', function() {
          if (confirm(`Möchtest du den Benutzer "${username}" wirklich löschen?`)) {
            if (deleteUser(username)) {
              alert('Benutzer erfolgreich gelöscht!');
              renderUsersList();
            } else {
              alert('Fehler beim Löschen des Benutzers!');
            }
          }
        });
        userActions.appendChild(deleteBtn);
      } else if (username === 'carlos') {
        const badge = document.createElement('span');
        badge.style.color = '#999';
        badge.style.fontSize = '0.85rem';
        badge.textContent = '(nicht löschbar)';
        userActions.appendChild(badge);
      } else if (username === currentUser) {
        const badge = document.createElement('span');
        badge.style.color = '#999';
        badge.style.fontSize = '0.85rem';
        badge.textContent = '(du bist dieser Benutzer)';
        userActions.appendChild(badge);
      }
      
      userItem.appendChild(userInfo);
      userItem.appendChild(userActions);
      usersList.appendChild(userItem);
    });
  }

  // Handle add user form
  if (addUserForm) {
    addUserForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const newUsername = document.getElementById('newUsername').value;
      const newUserPassword = document.getElementById('newUserPassword').value;
      const newUserSuperAdmin = document.getElementById('newUserSuperAdmin').checked;

      // Validate username
      if (newUsername.length < 3) {
        alert('Der Benutzername muss mindestens 3 Zeichen lang sein!');
        return;
      }

      // Validate password
      if (newUserPassword.length < 4) {
        alert('Das Passwort muss mindestens 4 Zeichen lang sein!');
        return;
      }

      // Check if username already exists
      const users = getAllUsers();
      if (users[newUsername]) {
        alert(`Der Benutzername "${newUsername}" existiert bereits!`);
        return;
      }

      // Add user
      if (addUser(newUsername, newUserPassword, newUserSuperAdmin)) {
        const statusText = newUserSuperAdmin ? 'Super Admin' : 'Admin';
        alert(`${statusText} "${newUsername}" erfolgreich hinzugefügt!`);
        addUserForm.reset();
        renderUsersList();
      } else {
        alert('Fehler beim Hinzufügen des Benutzers!');
      }
    });
  }

  // ==================== Logout ====================
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      localStorage.removeItem('currentAdminUser');
      alert('Du wurdest abgemeldet!');
      window.location.href = 'Untitled-1.html';
    });
  }

  // ==================== Mobile Navigation ====================
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');

  if (navToggle) {
    navToggle.addEventListener('click', function() {
      nav.classList.toggle('active');
    });

    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        nav.classList.remove('active');
      });
    });
  }
});
