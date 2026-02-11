// ==================== Admin Benutzer-System ====================
// Initialisiere das Benutzer-System bei erstem Laden
function initializeUserSystem() {
  const storedUsers = localStorage.getItem('adminUsers');
  if (!storedUsers) {
    // Erstelle Standard-Benutzer (nur carlos mit voller Kontrolle)
    const defaultUsers = {
      'carlos': {
        password: '1234',
        isAdmin: true,
        canCreateUsers: true
      }
    };
    localStorage.setItem('adminUsers', JSON.stringify(defaultUsers));
  }
}

// Benutzer authentifizieren
function authenticateUser(username, password) {
  const users = JSON.parse(localStorage.getItem('adminUsers') || '{}');
  return users[username] && users[username].password === password;
}

// Benutzer-Info abrufen
function getUserInfo(username) {
  const users = JSON.parse(localStorage.getItem('adminUsers') || '{}');
  return users[username];
}

// ==================== Admin Login System ====================
document.addEventListener('DOMContentLoaded', function() {
  initializeUserSystem();

  // Modal Elements
  const loginModal = document.getElementById('loginModal');
  const adminLoginBtn = document.getElementById('adminLoginBtn');
  const closeLoginModal = document.getElementById('closeLoginModal');
  const loginForm = document.getElementById('loginForm');
  const adminPanel = document.getElementById('adminPanel');
  const adminStatus = document.getElementById('adminStatus');
  const logoutBtn = document.getElementById('logoutBtn');

  // Check if user is already logged in
  const currentUser = localStorage.getItem('currentAdminUser');
  if (currentUser) {
    const userInfo = getUserInfo(currentUser);
    if (userInfo) {
      adminPanel.style.display = 'block';
      adminStatus.textContent = '✓ ' + currentUser;
      if (adminLoginBtn) adminLoginBtn.style.display = 'none';
    }
  }

  // Open login modal
  if (adminLoginBtn) {
    adminLoginBtn.addEventListener('click', function(e) {
      e.preventDefault();
      loginModal.classList.add('show');
    });
  }

  // Close login modal
  if (closeLoginModal) {
    closeLoginModal.addEventListener('click', function() {
      loginModal.classList.remove('show');
      loginForm.reset();
    });
  }

  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    if (event.target === loginModal) {
      loginModal.classList.remove('show');
      loginForm.reset();
    }
  });

  // Handle login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;

      // Check credentials
      if (authenticateUser(username, password)) {
        // Login erfolgreich
        localStorage.setItem('currentAdminUser', username);
        loginModal.classList.remove('show');
        loginForm.reset();
        
        // Redirect to admin area
        window.location.href = 'admin.html';
      } else {
        // Login fehlgeschlagen
        alert('Benutzername oder Passwort ist falsch!');
        loginForm.reset();
      }
    });
  }

  // Handle logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function() {
      localStorage.removeItem('currentAdminUser');
      adminPanel.style.display = 'none';
      adminStatus.textContent = '';
      if (adminLoginBtn) adminLoginBtn.style.display = 'block';
      alert('Sie wurden abgemeldet!');
    });
  }


  // Mobile Navigation Toggle
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.nav');

  if (navToggle) {
    navToggle.addEventListener('click', function() {
      nav.classList.toggle('active');
    });

    // Close menu when a link is clicked
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        nav.classList.remove('active');
      });
    });
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      if (href !== '#') {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // Intersection Observer for fade-in animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-in').forEach(elem => {
    observer.observe(elem);
  });
});

