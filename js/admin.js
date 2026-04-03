// ==================== Admin Panel JavaScript (mit Backend) ====================

const API_URL = window.location.hostname.includes('localhost') ? 'http://localhost:3000/api' : 'https://rp-world-backend.onrender.com/api';

// Benutzer-Info abrufen (über API)
async function getUserInfo(username) {
  try {
    const response = await fetch(`${API_URL}/user/${username}`);
    const data = await response.json();
    if (data.success) {
      return data.user;
    }
    return null;
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzerinfo:', error);
    return null;
  }
}

// Alle Benutzer abrufen (über API)
async function getAllUsers(adminUsername) {
  try {
    const response = await fetch(`${API_URL}/users/${adminUsername}`);
    const data = await response.json();
    if (data.success) {
      return data.users;
    }
    return [];
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzerliste:', error);
    return [];
  }
}

// Passwort ändern (über API)
async function changePassword(username, oldPassword, newPassword) {
  try {
    const response = await fetch(`${API_URL}/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, oldPassword, newPassword })
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Fehler beim Ändern des Passworts:', error);
    return false;
  }
}

// Neuen Benutzer hinzufügen (über API)
async function addUser(adminUsername, newUsername, newPassword, canCreateUsers) {
  try {
    const response = await fetch(`${API_URL}/create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adminUsername,
        newUsername,
        newPassword,
        canCreateUsers
      })
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Fehler beim Erstellen des Benutzers:', error);
    return false;
  }
}

// Benutzer löschen (über API)
async function deleteUser(adminUsername, targetUsername) {
  try {
    const response = await fetch(`${API_URL}/delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        adminUsername,
        targetUsername
      })
    });
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Fehler beim Löschen des Benutzers:', error);
    return false;
  }
}

// ==================== DOMw Ready ====================
document.addEventListener('DOMContentLoaded', async function() {
  // Check if user is logged in
  const currentUser = localStorage.getItem('currentAdminUser');
  
  if (!currentUser) {
    alert('Du musst angemeldet sein um auf diese Seite zuzugreifen!');
    window.location.href = 'Untitled-1.html';
    return;
  }

  // Get user info from API
  let userInfo = await getUserInfo(currentUser);
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
    changePasswordForm.addEventListener('submit', async function(e) {
      e.preventDefault();

      const currentPassword = document.getElementById('currentPassword').value;
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;

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

      // Change password via API
      const success = await changePassword(currentUser, currentPassword, newPassword);
      
      if (success) {
        alert('Passwort erfolgreich geändert! Die Änderung ist sofort auf allen Geräten verfügbar.');
        changePasswordModal.classList.remove('show');
        changePasswordForm.reset();
      } else {
        alert('Fehler beim Ändern des Passworts! Aktuelles Passwort ist möglicherweise falsch.');
        changePasswordForm.reset();
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
  async function renderUsersList() {
    const usersList = document.getElementById('usersList');
    const users = await getAllUsers(currentUser);
    
    usersList.innerHTML = '';

    if (users.length === 0) {
      usersList.innerHTML = '<p style="text-align: center; color: #999;">Keine Benutzer gefunden</p>';
      return;
    }

    users.forEach((userData) => {
      const username = userData.username;
      const userItem = document.createElement('div');
      userItem.className = 'user-item';
      
      const userInfo = document.createElement('div');
      userInfo.className = 'user-info';
      const createdAt = new Date(userData.createdAt).toLocaleDateString('de-DE');
      userInfo.innerHTML = `
        <div class="user-name">${username}</div>
        <div class="user-badge">${userData.canCreateUsers ? '👑 Super Admin' : '👤 Admin'}</div>
        <div style="font-size: 0.85rem; color: #999; margin-top: 0.3rem;">Erstellt: ${createdAt}</div>
      `;
      
      const userActions = document.createElement('div');
      userActions.className = 'user-actions';
      
      // Delete button (only for non-carlos users and not self)
      if (username !== 'carlos' && username !== currentUser) {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Löschen';
        deleteBtn.addEventListener('click', async function() {
          if (confirm(`Möchtest du den Benutzer "${username}" wirklich löschen?`)) {
            const success = await deleteUser(currentUser, username);
            if (success) {
              alert('Benutzer erfolgreich gelöscht! Die Änderung ist sofort auf allen Geräten verfügbar.');
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
    addUserForm.addEventListener('submit', async function(e) {
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

      // Add user via API
      const success = await addUser(currentUser, newUsername, newUserPassword, newUserSuperAdmin);
      
      if (success) {
        const statusText = newUserSuperAdmin ? 'Super Admin' : 'Admin';
        alert(`${statusText} "${newUsername}" erfolgreich hinzugefügt! Der Benutzer ist sofort auf allen Geräten verfügbar.`);
        addUserForm.reset();
        renderUsersList();
      } else {
        alert('Fehler beim Hinzufügen des Benutzers! Der Benutzername könnte bereits existieren.');
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

  // ==================== Superadmin Sidebar Sections ====================
  const addSectionButton = document.getElementById('add-section');
  const sectionsList = document.getElementById('sections-list');

  if (addSectionButton) {
    addSectionButton.addEventListener('click', () => {
      const sectionName = prompt('Enter the name of the new section:');
      if (sectionName) {
        const listItem = document.createElement('li');
        listItem.textContent = sectionName;
        listItem.contentEditable = true;
        sectionsList.appendChild(listItem);

        // Save section to the database (placeholder for now)
        console.log(`Section "${sectionName}" added.`);
      }
    });
  }

  // Load sections from the database (placeholder for now)
  console.log('Loading sections...');

  // ==================== Add Main Menu Item ====================
  const addMainMenuItemButton = document.getElementById('add-main-menu-item');

  addMainMenuItemButton.addEventListener('click', async () => {
    const menuItemName = prompt('Enter the name of the new menu item:');
    if (menuItemName) {
      try {
        const response = await fetch(`${API_URL}/create-menu-item`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ name: menuItemName })
        });

        if (response.ok) {
          alert('Menu item added successfully!');
        } else {
          alert('Failed to add menu item.');
        }
      } catch (error) {
        console.error('Error adding menu item:', error);
        alert('An error occurred while adding the menu item.');
      }
    }
  });

  // ==================== Manage Content ====================
  const manageContentButton = document.getElementById('manage-content');
  const contentModal = document.getElementById('content-modal');
  const contentEditor = document.getElementById('content-editor');
  const saveContentButton = document.getElementById('save-content');
  const closeModalButton = document.getElementById('close-modal');

  manageContentButton.addEventListener('click', async () => {
    // Check if the user is a super admin
    const currentUser = localStorage.getItem('currentAdminUser');
    const userInfo = await getUserInfo(currentUser);

    if (!userInfo || !userInfo.canCreateUsers) {
      alert('Nur Superadmins können diese Funktion nutzen.');
      return;
    }

    contentModal.style.display = 'block';
    // Load existing content (placeholder for now)
    contentEditor.value = 'Hier können Inhalte bearbeitet werden.';
  });

  saveContentButton.addEventListener('click', async () => {
    const updatedContent = contentEditor.value;
    try {
      const response = await fetch(`${API_URL}/update-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content: updatedContent })
      });

      if (response.ok) {
        alert('Inhalte erfolgreich gespeichert!');
        contentModal.style.display = 'none';
      } else {
        alert('Fehler beim Speichern der Inhalte.');
      }
    } catch (error) {
      console.error('Fehler beim Speichern der Inhalte:', error);
      alert('Ein Fehler ist aufgetreten.');
    }
  });

  closeModalButton.addEventListener('click', () => {
    contentModal.style.display = 'none';
  });

  // Add build functionality to the same button
  manageContentButton.addEventListener('dblclick', async () => {
    // Check if the user is a super admin
    const currentUser = localStorage.getItem('currentAdminUser');
    const userInfo = await getUserInfo(currentUser);

    if (!userInfo || !userInfo.canCreateUsers) {
      alert('Nur Superadmins können diese Funktion nutzen.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/start-build`, {
        method: 'POST'
      });

      if (response.ok) {
        alert('Build erfolgreich gestartet!');
      } else {
        alert('Fehler beim Starten des Builds.');
      }
    } catch (error) {
      console.error('Fehler beim Starten des Builds:', error);
      alert('Ein Fehler ist aufgetreten.');
    }
  });

  document.getElementById('admin-sidebar').appendChild(buildButton);
});

