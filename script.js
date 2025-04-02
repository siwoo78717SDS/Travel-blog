
const ADMIN_PASSWORD = '78717';
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('login-modal');
const adminPanel = document.getElementById('admin-panel');
const blogGrid = document.getElementById('blogGrid');

let posts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
let isAdmin = false;

// Event Listeners
loginBtn.addEventListener('click', () => loginModal.style.display = 'block');
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
document.getElementById('submitPassword').addEventListener('click', checkPassword);
document.getElementById('createPost').addEventListener('click', createPost);

// Close modals when clicking outside
window.addEventListener('click', (e) => {
    if (e.target === loginModal) loginModal.style.display = 'none';
    if (e.target === adminPanel) adminPanel.style.display = 'none';
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
    } else {
        alert('Incorrect password!');
    }
}

// Create new post
function createPost() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const location = document.getElementById('postLocation').value;
    const imageInput = document.getElementById('postImage');
    
    if (!title || !content || !location) {
        alert('Please fill in all fields');
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const post = {
            id: Date.now(),
            title,
            content,
            location,
            image: imageInput.files.length > 0 ? e.target.result : null,
            date: new Date().toLocaleDateString(),
            comments: []
        };

    posts.unshift(post);
    localStorage.setItem('blogPosts', JSON.stringify(posts));
    adminPanel.style.display = 'none';
    displayPosts();
    clearForm();
}

// Display posts
function displayPosts() {
    blogGrid.innerHTML = posts.map(post => `
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

function addComment(postId, inputElement) {
    const comment = inputElement.value.trim();
    if (!comment) return;
    
    const post = posts.find(p => p.id === postId);
    if (post) {
        post.comments.push(comment);
        localStorage.setItem('blogPosts', JSON.stringify(posts));
        displayPosts();
    }
    inputElement.value = '';
}

// Edit post
function editPost(id) {
    const post = posts.find(p => p.id === id);
    if (!post) return;

    document.getElementById('postTitle').value = post.title;
    document.getElementById('postContent').value = post.content;
    document.getElementById('postLocation').value = post.location;

    posts = posts.filter(p => p.id !== id);
    adminPanel.style.display = 'block';
}

// Clear form
function clearForm() {
    document.getElementById('postTitle').value = '';
    document.getElementById('postContent').value = '';
    document.getElementById('postLocation').value = 'vietnam';
}

// Initial display
displayPosts();
