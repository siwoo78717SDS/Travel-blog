const ADMIN_PASSWORD = '78717';
let currentUser = null;
let users = [];
let bannedIPs = [];
let posts = [];

// Initialize from localStorage
function initializeData() {
    users = JSON.parse(localStorage.getItem('users') || '[]');
    posts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
    bannedIPs = JSON.parse(localStorage.getItem('bannedIPs') || '[]');
}

// Save to localStorage
function saveData() {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('blogPosts', JSON.stringify(posts));
    localStorage.setItem('bannedIPs', JSON.stringify(bannedIPs));
}

// Check if user is banned
async function checkBanStatus() {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    const userIP = data.ip;

    if (bannedIPs.includes(userIP)) {
        alert('Access denied. Your IP has been banned.');
        document.body.innerHTML = '<h1>Access Denied</h1>';
        return false;
    }
    return true;
}

// User Authentication
document.getElementById('registerBtn').addEventListener('click', () => {
    document.getElementById('register-modal').style.display = 'block';
});

function showAdminLoginModal() {
    document.getElementById('login-modal').style.display = 'block';
    document.getElementById('loginUsername').value = 'admin';
}

document.getElementById('submitRegister').addEventListener('click', () => {
    const username = document.getElementById('regUsername').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;

    if (!username || !email || !password) {
        alert('Please fill in all fields');
        return;
    }

    if (users.some(u => u.username === username)) {
        alert('Username already exists');
        return;
    }

    const newUser = {
        username,
        email,
        password,
        isAdmin: false,
        isBanned: false,
        banExpiry: null
    };

    users.push(newUser);
    saveData();
    document.getElementById('register-modal').style.display = 'none';
    alert('Registration successful! Please sign in.');
});

document.getElementById('submitLogin').addEventListener('click', async () => {
    if (!await checkBanStatus()) return;

    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    if (username === 'admin' && password === ADMIN_PASSWORD) {
        currentUser = { username: 'admin', isAdmin: true };
        document.getElementById('login-modal').style.display = 'none';
        updateUIForUser();
        return;
    }

    const user = users.find(u => u.username === username && u.password === password);
    if (!user) {
        alert('Invalid credentials');
        return;
    }

    if (user.isBanned) {
        if (user.banExpiry && new Date() > new Date(user.banExpiry)) {
            user.isBanned = false;
            user.banExpiry = null;
            saveData();
        } else {
            alert('Your account has been banned');
            return;
        }
    }

    currentUser = user;
    document.getElementById('login-modal').style.display = 'none';
    updateUIForUser();
});

document.getElementById('signoutBtn').addEventListener('click', () => {
    currentUser = null;
    updateUIForUser();
});

function updateUIForUser() {
    const authButtons = document.getElementById('authButtons');
    const userInfo = document.getElementById('userInfo');
    const userDisplay = document.getElementById('userDisplay');
    const adminSettingsBtn = document.getElementById('adminSettingsBtn');
    const adminPanel = document.getElementById('admin-panel');

    if (currentUser) {
        if (currentUser.isAdmin) {
            adminSettingsBtn.style.display = 'inline-block';
            adminSettingsBtn.onclick = () => {
                adminPanel.style.display = 'block';
                backBtn.style.display = 'block';
                showAdminBenefits();
                displayMembers(); // Show member list when admin panel opens
            };
        } else {
            adminSettingsBtn.style.display = 'none';
        }
        authButtons.style.display = 'none';
        userInfo.style.display = 'flex';
        userDisplay.textContent = `Welcome, ${currentUser.username}${currentUser.isAdmin ? ' (Admin)' : ''}`;
        if (currentUser.isAdmin) {
            document.getElementById('loginBtn').textContent = 'Admin Panel';
            document.getElementById('loginBtn').onclick = () => {
                adminPanel.style.display = 'block';
                backBtn.style.display = 'block';
                showAdminBenefits();
            };
        } else {
            document.getElementById('loginBtn').textContent = 'Add Post';
            document.getElementById('loginBtn').onclick = () => adminPanel.style.display = 'block';
        }
    } else {
        authButtons.style.display = 'flex';
        userInfo.style.display = 'none';
        document.getElementById('loginBtn').textContent = 'Sign In';
        document.getElementById('loginBtn').onclick = () => loginModal.style.display = 'block';
    }
}

// Member Management
function displayMembers() {
    const membersList = document.getElementById('membersList');
    membersList.innerHTML = users.map(user => `
        <div class="member-item">
            <span>${user.username} (${user.email})</span>
            ${currentUser?.isAdmin ? `
                <button onclick="toggleBan('${user.username}', true)">Temp Ban</button>
                <button onclick="toggleBan('${user.username}', false)">Permanent Ban</button>
                <button onclick="toggleAdmin('${user.username}')">
                    ${user.isAdmin ? 'Remove Admin' : 'Make Admin'}
                </button>
            ` : ''}
        </div>
    `).join('');
}

function toggleBan(username, isTemporary) {
    const user = users.find(u => u.username === username);
    if (user) {
        user.isBanned = true;
        if (isTemporary) {
            user.banExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
        } else {
            user.banExpiry = null;
            fetch('https://api.ipify.org?format=json')
                .then(response => response.json())
                .then(data => {
                    if (!bannedIPs.includes(data.ip)) {
                        bannedIPs.push(data.ip);
                        saveData();
                    }
                });
        }
        saveData();
        displayMembers();
    }
}

function toggleAdmin(username) {
    const user = users.find(u => u.username === username);
    if (user) {
        user.isAdmin = !user.isAdmin;
        saveData();
        displayMembers();
    }
}

// Initialize the application
initializeData();
checkBanStatus();
updateUIForUser();


const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('login-modal');
const adminPanel = document.getElementById('admin-panel');
const blogGrid = document.getElementById('blogGrid');

// Fetch posts from ReplDB on page load
async function loadPosts() {
    const db = await initReplDB();
    const storedPosts = await db.get('blogPosts');
    posts = JSON.parse(storedPosts || '[]');
    displayPosts();
}

loadPosts();

let isAdmin = false;

// Event Listeners
const backBtn = document.getElementById('backBtn');

backBtn.addEventListener('click', () => {
    adminPanel.style.display = 'none';
    loginModal.style.display = 'none';
    backBtn.style.display = 'none';
});

// Show back button when needed
loginBtn.addEventListener('click', () => {
    backBtn.style.display = 'block';
});
document.getElementById('createPost').addEventListener('click', createPost);

// Store last location before modal
let lastLocation = null;

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === loginModal) {
        loginModal.style.display = 'none';
        if (lastLocation) window.history.pushState({}, '', lastLocation);
    }
    if (e.target === adminPanel) {
        adminPanel.style.display = 'none';
        if (lastLocation) window.history.pushState({}, '', lastLocation);
    }
});

// Store location before showing modal
function showModal(modal) {
    lastLocation = window.location.href;
    modal.style.display = 'block';
}

// Homepage navigation
document.querySelector('nav h1').addEventListener('click', () => {
    window.location.href = '/';
});

// Tab switching functionality
document.querySelectorAll('.tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        button.classList.add('active');
        document.getElementById(`${button.dataset.tab}-tab`).classList.add('active');
    });
});

// Check password
function checkPassword() {
    const password = document.getElementById('passwordInput').value;
    if (password === ADMIN_PASSWORD) {
        isAdmin = true;
        loginModal.style.display = 'none';
        adminPanel.style.display = 'block';
        loginBtn.textContent = 'Add Post';
        loginBtn.onclick = () => adminPanel.style.display = 'block';
        updateDestinationsList();
    } else {
        alert('Incorrect password!');
    }
}

// Destination management
document.getElementById('addDestination').addEventListener('click', async () => {
    const newDestination = document.getElementById('newDestination').value.trim().toLowerCase();
    if (!newDestination) return;

    const destinationList = document.querySelector('#categories');
    const newDestinationHtml = `
        <li class="destination-category">
            <a href="#" data-destination="${newDestination}">${newDestination}</a>
            <ul class="subcategories">
                <li><a href="#" data-destination="${newDestination}" data-category="food">Food</a></li>
                <li><a href="#" data-destination="${newDestination}" data-category="culture">Culture</a></li>
                <li><a href="#" data-destination="${newDestination}" data-category="attractions">Attractions</a></li>
            </ul>
        </li>
    `;
    destinationList.insertAdjacentHTML('beforeend', newDestinationHtml);

    document.getElementById('newDestination').value = '';
    document.getElementById('postLocation').innerHTML += `<option value="${newDestination}">${newDestination}</option>`;
    updateDestinationsList();
});

function updateDestinationsList() {
    const destinations = Array.from(document.querySelectorAll('[data-destination]'))
        .map(el => el.dataset.destination)
        .filter((value, index, self) => self.indexOf(value) === index && value !== 'all');

    const destinationsList = document.getElementById('destinationsList');
    destinationsList.innerHTML = destinations.map(dest =>
        `<div class="destination-item">${dest}</div>`
    ).join('');
}

// Create new post
async function createPost() {
    if (!currentUser) {
        alert('Please sign in to create posts');
        return;
    }
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const location = document.getElementById('postLocation').value;
    const imageInput = document.getElementById('postImage');
    const category = document.getElementById('postCategory').value;
    const isMembersOnly = document.getElementById('membersOnly').checked;

    if (!title || !content || !location || !category) {
        alert('Please fill in all fields');
        return;
    }

    const reader = new FileReader();
    reader.onload = async function(e) {
        const post = {
            id: Date.now(),
            title,
            content,
            location,
            category,
            image: imageInput.files.length > 0 ? e.target.result : null,
            date: new Date().toLocaleDateString(),
            comments: []
        };

        posts.unshift(post);
        const db = await initReplDB();
        await db.set('blogPosts', JSON.stringify(posts));
        adminPanel.style.display = 'none';
        displayPosts();
        clearForm();
    };

    if (imageInput.files.length > 0) {
        reader.readAsDataURL(imageInput.files[0]);
    } else {
        const post = {
            id: Date.now(),
            title,
            content,
            location,
            category,
            image: null,
            date: new Date().toLocaleDateString(),
            comments: []
        };

        posts.unshift(post);
        const db = await initReplDB();
        await db.set('blogPosts', JSON.stringify(posts));
        adminPanel.style.display = 'none';
        displayPosts();
        clearForm();
    }
}

// Display posts
function displayPosts() {
    const allPosts = posts.map(post => {
        if ((post.isMembersOnly || post.category === 'tips' || post.location === 'tips') && !currentUser) {
            return `
                <div class="blog-post member-locked">
                    <div class="member-lock-overlay">
                        <h3>🔒 Members Only Content</h3>
                        <p>Please register to access exclusive travel content!</p>
                        <button onclick="document.getElementById('register-modal').style.display='block'">Register Now</button>
                    </div>
                    <span class="location-badge">${post.location}</span>
                    <h3>${post.title}</h3>
                    <div class="blur-content">
                        ${post.image ? `<img src="${post.image}" class="post-image" alt="${post.title}">` : ''}
                        <p>${post.content}</p>
                    </div>
                </div>
            `;
        }
        return `
        <div class="blog-post">
            <span class="location-badge">${post.location}</span>
            <h3>${post.title}</h3>
            ${post.image ? `<img src="${post.image}" class="post-image" alt="${post.title}">` : ''}
            <p>${post.content}</p>
            <small>${post.date}</small>
            ${isAdmin ? `<button class="edit-button" onclick="editPost(${post.id})">Edit</button>` : ''}
            <div class="comments-section">
                <h4>Comments</h4>
                ${post.comments.map(comment => `
                    <div class="comment">${comment}</div>
                `).join('')}
                <input type="text" class="comment-input" placeholder="Add a comment">
                <button onclick="addComment(${post.id}, this.previousElementSibling)">Comment</button>
            </div>
        </div>
    `;
    }).join('');
    
    blogGrid.innerHTML = allPosts;
}
}

async function addComment(postId, inputElement) {
    const comment = inputElement.value.trim();
    if (!comment) return;

    const post = posts.find(p => p.id === postId);
    if (post) {
        post.comments.push(comment);
        const db = await initReplDB();
        await db.set('blogPosts', JSON.stringify(posts));
        displayPosts();
    }
    inputElement.value = '';
}

// Edit post
async function editPost(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    document.getElementById('postTitle').value = post.title;
    document.getElementById('postContent').value = post.content;
    document.getElementById('postLocation').value = post.location;
    document.getElementById('postCategory').value = post.category; // Add category to edit

    posts = posts.filter(p => p.id !== id);
    adminPanel.style.display = 'block';
}

// Clear form
function clearForm() {
    document.getElementById('postTitle').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('postLocation').value = 'vietnam';
    document.getElementById('postCategory').value = 'all'; // Reset category
}

// Category filtering
document.getElementById('categories').addEventListener('click', (e) => {
    if (e.target.tagName === 'A') {
        e.preventDefault();
        const destination = e.target.dataset.destination;
        const category = e.target.dataset.category;

        // Update active states
        document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
        e.target.classList.add('active');

        // Toggle destination subcategories
        if (destination && !category) {
            const parentLi = e.target.closest('.destination-category');
            document.querySelectorAll('.destination-category').forEach(li => li.classList.remove('active'));
            if (parentLi) parentLi.classList.add('active');
        }

        // Filter posts
        if (destination === 'all') {
            displayPosts();
        } else if (destination && category) {
            const filteredPosts = posts.filter(post =>
                post.location.toLowerCase() === destination &&
                post.category === category
            );
            displayFilteredPosts(filteredPosts);
        } else if (destination) {
            const filteredPosts = posts.filter(post =>
                post.location.toLowerCase() === destination
            );
            displayFilteredPosts(filteredPosts);
        }
    }
});

function displayFilteredPosts(filteredPosts) {
    blogGrid.innerHTML = filteredPosts.map(post => `
        <div class="blog-post">
            <span class="location-badge">${post.location}</span>
            <h3>${post.title}</h3>
            ${post.image ? `<img src="${post.image}" class="post-image" alt="${post.title}">` : ''}
            <p>${post.content}</p>
            <small>${post.date}</small>
            ${isAdmin ? `<button class="edit-button" onclick="editPost(${post.id})">Edit</button>` : ''}
            <div class="comments-section">
                <h4>Comments</h4>
                ${post.comments.map(comment => `
                    <div class="comment">${comment}</div>
                `).join('')}
                <input type="text" class="comment-input" placeholder="Add a comment">
                <button onclick="addComment(${post.id}, this.previousElementSibling)">Comment</button>
            </div>
        </div>
    `).join('');
}



// Show admin benefits
function showAdminBenefits() {
    if (!currentUser?.isAdmin) return;
    
    const adminBenefits = `
        <div class="admin-benefits">
            <h3>Admin Benefits & Controls:</h3>
            <div class="admin-controls">
                <button onclick="handleAdminControl('posts')" class="admin-control-btn">Create and Edit Posts</button>
                <button onclick="handleAdminControl('members')" class="admin-control-btn">Manage User Accounts</button>
                <button onclick="handleAdminControl('destinations')" class="admin-control-btn">Manage Destinations</button>
                <button onclick="showActivityMonitor()" class="admin-control-btn">Monitor Activity</button>
            </div>
        </div>
    `;
    
    const adminTabs = document.querySelector('.admin-tabs');
    // Remove existing benefits if present
    const existingBenefits = document.querySelector('.admin-benefits');
    if (existingBenefits) {
        existingBenefits.remove();
    }
    adminTabs.insertAdjacentHTML('afterend', adminBenefits);
}

// Show activity monitor with actual data
function showActivityMonitor() {
    if (!currentUser?.isAdmin) return;
    
    const activity = {
        totalUsers: users.length,
        totalPosts: posts.length,
        bannedUsers: users.filter(u => u.isBanned).length,
        admins: users.filter(u => u.isAdmin).length
    };
    
    alert(`Activity Statistics:\n
    Total Users: ${activity.totalUsers}
    Total Posts: ${activity.totalPosts}
    Banned Users: ${activity.bannedUsers}
    Admin Users: ${activity.admins}`);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    const targetTab = document.querySelector(`[data-tab="${tabName}"]`);
    if (targetTab) {
        targetTab.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.add('active');
    }
}

function showActivityMonitor() {
    if (!currentUser?.isAdmin) return;
    
    // Calculate analytics
    const userAnalytics = {
        totalUsers: users.length,
        activeUsers: users.filter(u => !u.isBanned).length,
        totalPosts: posts.length,
        postsPerUser: (posts.length / (users.length || 1)).toFixed(2),
        memberOnlyPosts: posts.filter(p => p.isMembersOnly).length,
        categoriesUsed: [...new Set(posts.map(p => p.category))].length,
        mostActiveLocation: getMostFrequent(posts.map(p => p.location)),
        mostActiveCategory: getMostFrequent(posts.map(p => p.category)),
        userEngagement: `${((posts.reduce((acc, post) => acc + post.comments.length, 0) / posts.length) || 0).toFixed(2)} comments/post`
    };

    const analyticsHTML = `
        <div class="analytics-modal">
            <h2>User Analytics Dashboard</h2>
            <div class="analytics-grid">
                <div class="stat-card">
                    <h3>Users</h3>
                    <p>Total: ${userAnalytics.totalUsers}</p>
                    <p>Active: ${userAnalytics.activeUsers}</p>
                </div>
                <div class="stat-card">
                    <h3>Posts</h3>
                    <p>Total: ${userAnalytics.totalPosts}</p>
                    <p>Per User: ${userAnalytics.postsPerUser}</p>
                </div>
                <div class="stat-card">
                    <h3>Content</h3>
                    <p>Member Posts: ${userAnalytics.memberOnlyPosts}</p>
                    <p>Categories: ${userAnalytics.categoriesUsed}</p>
                </div>
                <div class="stat-card">
                    <h3>Engagement</h3>
                    <p>Most Active: ${userAnalytics.mostActiveLocation}</p>
                    <p>Top Category: ${userAnalytics.mostActiveCategory}</p>
                    <p>Engagement: ${userAnalytics.userEngagement}</p>
                </div>
            </div>
        </div>
    `;

    const modalDiv = document.createElement('div');
    modalDiv.className = 'modal';
    modalDiv.style.display = 'block';
    modalDiv.innerHTML = `
        <div class="modal-content">
            ${analyticsHTML}
            <button onclick="this.closest('.modal').remove()">Close</button>
        </div>
    `;
    document.body.appendChild(modalDiv);
}

function getMostFrequent(arr) {
    return arr.length ? arr.sort((a,b) =>
        arr.filter(v => v === a).length - arr.filter(v => v === b).length
    ).pop() : 'None';
}

// Initialize ReplDB
async function initReplDB() {
    return {
        async get(key) {
            return localStorage.getItem(key);
        },
        async set(key, value) {
            localStorage.setItem(key, value);
        }
    };
}
function handleAdminControl(tab) {
    // Switch to the correct tab
    const tabButton = document.querySelector(`[data-tab="${tab}"]`);
    if (tabButton) {
        tabButton.click();
    }
    
    // Perform tab-specific actions
    switch(tab) {
        case 'posts':
            document.getElementById('posts-tab').classList.add('active');
            break;
        case 'members':
            document.getElementById('members-tab').classList.add('active');
            displayMembers();
            break;
        case 'destinations':
            document.getElementById('destinations-tab').classList.add('active');
            updateDestinationsList();
            break;
    }
}
