const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const sanitizeHtml = require('sanitize-html');

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

// Initialize SQLite database
const db = new sqlite3.Database('./data/users.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database.');
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )`, (err) => {
      if (err) {
        console.error('Error creating users table:', err.message);
      }
    });
  }
});

// Create menu_items table if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE
)`, (err) => {
  if (err) {
    console.error('Error creating menu_items table:', err.message);
  }
});

// Function to hash passwords
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Middleware to sanitize user inputs
app.use((req, res, next) => {
  for (const key in req.body) {
    if (req.body.hasOwnProperty(key)) {
      req.body[key] = sanitizeHtml(req.body[key]);
    }
  }
  next();
});

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

// Create a new main menu item
app.post('/api/create-menu-item', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).send('Menu item name is required.');
  }

  db.run(
    `INSERT INTO menu_items (name) VALUES (?)`,
    [name],
    (err) => {
      if (err) {
        console.error('Error creating menu item:', err.message);
        return res.status(500).send('Failed to create menu item.');
      }
      res.status(201).send('Menu item created successfully.');
    }
  );
});

// Get all menu items
app.get('/api/menu-items', (req, res) => {
  db.all(`SELECT * FROM menu_items`, [], (err, rows) => {
    if (err) {
      console.error('Error fetching menu items:', err.message);
      return res.status(500).send('Failed to fetch menu items.');
    }
    res.json(rows);
  });
});

// Update content endpoint
app.post('/api/update-content', (req, res) => {
  const { content } = req.body;
  if (!content) {
    return res.status(400).send('Content is required.');
  }

  // Save content to a file (or database in a real-world scenario)
  fs.writeFile('./data/content.txt', content, (err) => {
    if (err) {
      console.error('Error saving content:', err.message);
      return res.status(500).send('Failed to save content.');
    }
    res.status(200).send('Content updated successfully.');
  });
});

// Endpoint to trigger build process
app.post('/api/start-build', (req, res) => {
  const { exec } = require('child_process');

  exec('npm run build', (error, stdout, stderr) => {
    if (error) {
      console.error(`Build error: ${error.message}`);
      return res.status(500).send('Build failed.');
    }

    if (stderr) {
      console.error(`Build stderr: ${stderr}`);
      return res.status(500).send('Build encountered issues.');
    }

    console.log(`Build stdout: ${stdout}`);
    res.status(200).send('Build started successfully.');
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('Server is running');
});

// Server starten
initializeDatabase();
app.listen(PORT, () => {
  console.log(`RP World Server läuft auf http://localhost:${PORT}`);
  console.log(`Standardbenutzer: carlos, Passwort: 1234`);
});

// Example route to add a new user
app.post('/register', async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).send('All fields are required.');
  }

  if (username.length < 3 || password.length < 6) {
    return res.status(400).send('Invalid input: Username must be at least 3 characters and password at least 6 characters.');
  }

  try {
    const hashedPassword = await hashPassword(password);
    db.run(
      `INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
      [username, hashedPassword, role],
      (err) => {
        if (err) {
          console.error('Error inserting user:', err.message);
          res.status(500).send('Error registering user.');
        } else {
          res.status(201).send('User registered successfully.');
        }
      }
    );
  } catch (error) {
    console.error('Error hashing password:', error.message);
    res.status(500).send('Error registering user.');
  }
});

// API-Endpunkt zum Speichern von Inhalten
app.post('/api/content', (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Titel und Inhalt sind erforderlich.' });
  }

  const filePath = path.join(__dirname, 'data', `${title.replace(/\s+/g, '_')}.html`);

  fs.writeFile(filePath, content, (err) => {
    if (err) {
      console.error('Fehler beim Speichern der Datei:', err);
      return res.status(500).json({ error: 'Fehler beim Speichern der Datei.' });
    }

    res.json({ message: 'Inhalt erfolgreich gespeichert!' });
  });
});

// Statische Dateien bereitstellen
app.use(express.static(path.join(__dirname, 'build')));

// Server starten
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});
