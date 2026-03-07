const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname));

// Datenbank-Dateipfad
const usersFile = path.join(__dirname, 'data', 'users.json');

// Stelle sicher, dass das data-Verzeichnis existiert
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'));
}

// Initialisiere users.json wenn nicht vorhanden
function initializeDatabase() {
  if (!fs.existsSync(usersFile)) {
    const defaultUsers = {
      'carlos': {
        password: '1234',
        canCreateUsers: true,
        createdAt: new Date().toISOString()
      }
    };
    fs.writeFileSync(usersFile, JSON.stringify(defaultUsers, null, 2));
  }
}

// Benutzer aus Datei lesen
function getUsers() {
  try {
    const data = fs.readFileSync(usersFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Fehler beim Lesen der Benutzer:', error);
    return {};
  }
}

// Benutzer in Datei speichern
function saveUsers(users) {
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
    return true;
  } catch (error) {
    console.error('Fehler beim Speichern der Benutzer:', error);
    return false;
  }
}

// ==================== API Endpoints ====================

// Login
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  const users = getUsers();

  if (users[username] && users[username].password === password) {
    res.json({
      success: true,
      username: username,
      message: 'Login erfolgreich'
    });
  } else {
    res.status(401).json({
      success: false,
      message: 'Benutzername oder Passwort ist falsch!'
    });
  }
});

// Benutzer-Info abrufen
app.get('/api/user/:username', (req, res) => {
  const { username } = req.params;
  const users = getUsers();

  if (users[username]) {
    const userInfo = { ...users[username] };
    delete userInfo.password; // Passwort nicht zurückgeben
    res.json({
      success: true,
      user: {
        username: username,
        ...userInfo
      }
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Benutzer nicht gefunden'
    });
  }
});

// Alle Benutzer abrufen (nur für Admin)
app.get('/api/users/:adminUsername', (req, res) => {
  const { adminUsername } = req.params;
  const users = getUsers();

  if (!users[adminUsername] || !users[adminUsername].canCreateUsers) {
    return res.status(403).json({
      success: false,
      message: 'Keine Berechtigung'
    });
  }

  const usersList = Object.keys(users).map(username => ({
    username: username,
    canCreateUsers: users[username].canCreateUsers,
    createdAt: users[username].createdAt
  }));

  res.json({
    success: true,
    users: usersList
  });
});

// Passwort ändern
app.post('/api/change-password', (req, res) => {
  const { username, oldPassword, newPassword } = req.body;
  const users = getUsers();

  if (!users[username]) {
    return res.status(404).json({
      success: false,
      message: 'Benutzer nicht gefunden'
    });
  }

  if (users[username].password !== oldPassword) {
    return res.status(401).json({
      success: false,
      message: 'Altes Passwort ist falsch'
    });
  }

  users[username].password = newPassword;
  users[username].updatedAt = new Date().toISOString();

  if (saveUsers(users)) {
    res.json({
      success: true,
      message: 'Passwort erfolgreich geändert'
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Fehler beim Speichern'
    });
  }
});

// Neuen Benutzer erstellen
app.post('/api/create-user', (req, res) => {
  const { adminUsername, newUsername, newPassword, canCreateUsers } = req.body;
  const users = getUsers();

  // Check if admin has permission
  if (!users[adminUsername] || !users[adminUsername].canCreateUsers) {
    return res.status(403).json({
      success: false,
      message: 'Keine Berechtigung zum Erstellen von Benutzern'
    });
  }

  // Check if user already exists
  if (users[newUsername]) {
    return res.status(400).json({
      success: false,
      message: 'Benutzer existiert bereits'
    });
  }

  // Create new user
  users[newUsername] = {
    password: newPassword,
    canCreateUsers: canCreateUsers || false,
    createdAt: new Date().toISOString(),
    createdBy: adminUsername
  };

  if (saveUsers(users)) {
    res.json({
      success: true,
      message: 'Benutzer erfolgreich erstellt',
      username: newUsername
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen des Benutzers'
    });
  }
});

// Benutzer löschen
app.post('/api/delete-user', (req, res) => {
  const { adminUsername, targetUsername } = req.body;
  const users = getUsers();

  // Check if admin has permission
  if (!users[adminUsername] || !users[adminUsername].canCreateUsers) {
    return res.status(403).json({
      success: false,
      message: 'Keine Berechtigung zum Löschen von Benutzern'
    });
  }

  // Protect default user
  if (targetUsername === 'carlos') {
    return res.status(403).json({
      success: false,
      message: 'carlos kann nicht gelöscht werden'
    });
  }

  if (!users[targetUsername]) {
    return res.status(404).json({
      success: false,
      message: 'Benutzer nicht gefunden'
    });
  }

  delete users[targetUsername];

  if (saveUsers(users)) {
    res.json({
      success: true,
      message: 'Benutzer erfolgreich gelöscht'
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen des Benutzers'
    });
  }
});

// Server starten
initializeDatabase();
app.listen(PORT, () => {
  console.log(`RP World Server läuft auf http://localhost:${PORT}`);
  console.log(`Standardbenutzer: carlos, Passwort: 1234`);
});
