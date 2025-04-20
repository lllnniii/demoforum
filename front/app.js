// Конфигурация
const API_BASE = 'http://localhost:8000';
const POSTS_PER_PAGE = 10;

// Состояние приложения
let currentUser = null;
let currentCategoryId = null;
let authorsCache = {};
let categoriesCache = [];

// DOM элементы
const pages = {
    main: document.getElementById('mainPage'),
    posts: document.getElementById('postsPage'),
    singlePost: document.getElementById('singlePostPage'),
    categories: document.getElementById('categoriesPage'),
    categoryPosts: document.getElementById('categoryPostsPage'),
    account: document.getElementById('accountPage'),
    createPost: document.getElementById('createPostPage')
};

const sidebars = {
    main: document.getElementById('mainSidebar'),
    posts: document.getElementById('postsSidebar'),
    categories: document.getElementById('categoriesSidebar')
};

// Инициализация
window.onload = function() {
    showMainPage();
    checkAuthStatus();
    loadRecentPosts();
    loadCategoriesForPostForm();
};

// Навигация
function showMainPage() {
    hideAllPages();
    hideAllSidebars();
    pages.main.classList.remove('hidden');
    sidebars.main.classList.remove('hidden');
    document.getElementById('recentPosts').classList.remove('hidden');
}

function showPostsPage() {
    hideAllPages();
    hideAllSidebars();
    pages.posts.classList.remove('hidden');
    sidebars.posts.classList.remove('hidden');
    loadAllPosts();
    loadPostsForSidebar();
}

function showSinglePost(postId) {
    hideAllPages();
    pages.singlePost.classList.remove('hidden');
    loadSinglePost(postId);
}

function showCategoryPosts(categoryId, categoryName = null) {
    hideAllPages();
    pages.categoryPosts.classList.remove('hidden');
    currentCategoryId = categoryId;

    if (categoryName) {
        document.getElementById('categoryPostsTitle').textContent = `Посты категории: ${categoryName}`;
    } else {
        document.getElementById('categoryPostsTitle').textContent = 'Посты категории';
    }

    loadPostsByCategory(categoryId);
}

function showCategoriesPage() {
    hideAllPages();
    hideAllSidebars();
    pages.categories.classList.remove('hidden');
    sidebars.categories.classList.remove('hidden');
    loadAllCategories();
}

function showAccountPage() {
    hideAllPages();
    pages.account.classList.remove('hidden');
    loadAccountInfo();
    loadUserPosts();
}

function showCreatePostForm() {
    hideAllPages();
    pages.createPost.classList.remove('hidden');
    loadCategoriesForPostForm();
}

function hideAllPages() {
    Object.values(pages).forEach(page => page.classList.add('hidden'));
}

function hideAllSidebars() {
    Object.values(sidebars).forEach(sidebar => sidebar.classList.add('hidden'));
}

function hideAllPages() {
    Object.values(pages).forEach(page => page.classList.add('hidden'));
}

function hideAllSidebars() {
    Object.values(sidebars).forEach(sidebar => sidebar.classList.add('hidden'));
}


// Модальные окна
function showLoginModal() {
    document.getElementById('loginError').style.display = 'none';
    document.getElementById('loginModal').style.display = 'flex';
    document.getElementById('loginUsername').focus();
}

function showRegisterModal() {
    document.getElementById('registerError').style.display = 'none';
    document.getElementById('registerModal').style.display = 'flex';
    document.getElementById('registerUsername').focus();
}

function hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

function switchToRegister() {
    hideModal('loginModal');
    showRegisterModal();
}

function switchToLogin() {
    hideModal('registerModal');
    showLoginModal();
}

// Загрузка данных с сортировкой от новых к старым
async function loadRecentPosts() {
    try {
        const response = await fetch(`${API_BASE}/posts/`);
        if (!response.ok) throw new Error('Ошибка загрузки постов');
        const posts = await response.json();
        // Сортировка по дате создания (новые сначала)
        const sortedPosts = posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        displayPosts(sortedPosts.slice(0, 5), 'recentPostsContainer');
    } catch (error) {
        console.error('Ошибка загрузки последних постов:', error);
    }
}

async function loadAllPosts() {
    try {
        document.getElementById('postsContainer').innerHTML = '<div class="loading">Загрузка...</div>';
        const response = await fetch(`${API_BASE}/posts/`);
        if (!response.ok) throw new Error('Ошибка загрузки постов');
        const posts = await response.json();
        // Сортировка по дате создания (новые сначала)
        const sortedPosts = posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        displayPosts(sortedPosts, 'postsContainer');
    } catch (error) {
        console.error('Ошибка загрузки постов:', error);
        document.getElementById('postsContainer').innerHTML = '<p>Ошибка загрузки постов</p>';
    }
}

async function loadPostsByCategory(categoryId) {
    try {
        document.getElementById('categoryPostsContainer').innerHTML = '<div class="loading">Загрузка...</div>';
        const response = await fetch(`${API_BASE}/posts/posts_by_category/${categoryId}`);
        if (!response.ok) throw new Error('Ошибка загрузки постов');
        const posts = await response.json();
        // Сортировка по дате создания (новые сначала)
        const sortedPosts = posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        displayPosts(sortedPosts, 'categoryPostsContainer');
    } catch (error) {
        console.error('Ошибка загрузки постов:', error);
        document.getElementById('categoryPostsContainer').innerHTML = '<p>Ошибка загрузки постов</p>';
    }
}


async function loadUserPosts() {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) throw new Error('No token found');
        
        const response = await fetch(`${API_BASE}/posts/user/my`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            let errorMessage = 'Ошибка загрузки постов';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                errorMessage = `HTTP error ${response.status}`;
            }
            throw new Error(errorMessage);
        }
        
        const posts = await response.json();
        const sortedPosts = posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // Отрисовка постов
        const container = document.getElementById('userPostsContainer');
        if (!container) throw new Error('Контейнер для постов не найден');
        
        if (sortedPosts.length === 0) {
            container.innerHTML = '<p>У вас пока нет постов.</p>';
        } else {
            container.innerHTML = sortedPosts.map(post => `
                <div class="post-item" style="margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid #eee;">
                    <h3 style="margin-top: 0; color: #2c3e50;">${post.title || 'Без названия'}</h3>
                    <div style="word-wrap: break-word; white-space: pre-wrap; margin: 10px 0;">
                        ${post.content || ''}
                    </div>
                    <small style="color: #666; display: block; margin-top: 5px;">
                        ${post.created_at ? new Date(post.created_at).toLocaleString() : 'Дата не указана'}
                    </small>
                    <button onclick="showSinglePost(${post.id})" 
                            style="background: #4CAF50; color: white; border: none; padding: 8px 16px; 
                                   margin-top: 10px; border-radius: 4px; cursor: pointer;">
                        Подробнее
                    </button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Ошибка загрузки постов:', error);
        const container = document.getElementById('userPostsContainer');
        if (container) {
            container.innerHTML = `<p>Ошибка загрузки постов: ${error.message}</p>`;
        }
        
        if (error.message.toLowerCase().includes('token') || error.message.includes('401')) {
            window.location.href = '/login';
        }
    }
}




async function loadPostsForSidebar() {
    try {
        const response = await fetch(`${API_BASE}/posts/`);
        if (!response.ok) throw new Error('Ошибка загрузки постов');
        const posts = await response.json();
        // Сортировка для сайдбара (новые сначала)
        const sortedPosts = posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        displayPostsInSidebar(sortedPosts);
    } catch (error) {
        console.error('Ошибка загрузки постов:', error);
    }
}

async function loadSinglePost(postId) {
    try {
        document.getElementById('postDetail').innerHTML = '<div class="loading">Загрузка...</div>';
        const response = await fetch(`${API_BASE}/posts/${postId}`);
        if (!response.ok) throw new Error('Ошибка загрузки поста');
        const post = await response.json();

        // Получаем имя автора
        let authorName = `ID: ${post.author_id}`;
        if (authorsCache[post.author_id]) {
            authorName = authorsCache[post.author_id];
        } else {
            try {
                const userResponse = await fetch(`${API_BASE}/users/${post.author_id}`);
                if (userResponse.ok) {
                    const user = await userResponse.json();
                    authorName = user.username;
                    authorsCache[post.author_id] = authorName;
                }
            } catch (userError) {
                console.error('Ошибка загрузки автора:', userError);
            }
        }

        displaySinglePost(post, authorName);
    } catch (error) {
        console.error('Ошибка загрузки поста:', error);
        document.getElementById('postDetail').innerHTML = '<p>Ошибка загрузки поста</p>';
    }
}

async function loadAllCategories() {
    try {
        document.getElementById('categoriesContainer').innerHTML = '<div class="loading">Загрузка...</div>';
        const response = await fetch(`${API_BASE}/categories/`);
        if (!response.ok) throw new Error('Ошибка загрузки категорий');
        const categories = await response.json();
        categoriesCache = categories; // Сохраняем в кэш
        displayCategories(categories);
        displayCategoriesInSidebar(categories);
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
        document.getElementById('categoriesContainer').innerHTML = '<p>Ошибка загрузки категорий</p>';
    }
}

async function loadCategoriesForPostForm() {
    try {
        const response = await fetch(`${API_BASE}/categories/`);
        if (!response.ok) throw new Error('Ошибка загрузки категорий');
        const categories = await response.json();
        categoriesCache = categories; // Сохраняем в кэш

        const select = document.getElementById('postCategory');
        select.innerHTML = '';

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Ошибка загрузки категорий:', error);
    }
}

// Отображение данных
function displayPosts(posts, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = posts.length ? '' : '<p>Постов не найдено</p>';

    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'post-detail';
        const authorName = authorsCache[post.author_id] || `ID: ${post.author_id}`;

        postElement.innerHTML = `
            <div class="post-title">${post.title}</div>
            <div class="post-meta">
                <span>Автор: ${authorName}</span>
                <span>Категория: ${post.category_id}</span>
                <span>Дата: ${new Date(post.created_at).toLocaleString()}</span>
            </div>
            <div class="post-content">${post.content.substring(0, 100)}...</div>
            <button onclick="showSinglePost(${post.id})">Подробнее</button>
            ${currentUser && post.author_id === currentUser.id ?
              `<button onclick="deletePost(${post.id})" style="margin-left: 0.5rem; background-color: #f8d7da;">Удалить</button>` : ''}
        `;
        container.appendChild(postElement);
    });
}

function displayPostsInSidebar(posts) {
    const list = document.getElementById('postList');
    list.innerHTML = '';

    posts.slice(0, 10).forEach(post => {
        const li = document.createElement('li');
        li.textContent = post.title.length > 30 ? post.title.substring(0, 30) + '...' : post.title;
        li.title = post.title;
        li.onclick = () => showSinglePost(post.id);
        list.appendChild(li);
    });
}

function displaySinglePost(post, authorName) {
    const container = document.getElementById('postDetail');
    container.innerHTML = `
        <div class="post-title">${post.title}</div>
        <div class="post-meta">
            <span>Автор: ${authorName}</span>
            <span>Категория: ${post.category_id}</span>
            <span>Дата: ${new Date(post.created_at).toLocaleString()}</span>
        </div>
        <div class="post-content">${post.content}</div>
        ${currentUser && post.author_id === currentUser.id ?
          `<button onclick="deletePost(${post.id})" style="background-color: #f8d7da;">Удалить пост</button>` : ''}
        <button class="back-button" onclick="${currentCategoryId ? `showCategoryPosts(${currentCategoryId})` : 'showPostsPage()'}">Назад к списку</button>
    `;
}

function displayCategories(categories) {
    const container = document.getElementById('categoriesContainer');
    container.innerHTML = categories.length ? '' : '<p>Категорий не найдено</p>';

    categories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'post-detail';
        categoryElement.innerHTML = `
            <div class="post-title">${category.name}</div>
            <div class="post-content">${category.description || 'Нет описания'}</div>
            <button onclick="showCategoryPosts(${category.id}, '${category.name}')">Показать посты</button>
        `;
        container.appendChild(categoryElement);
    });
}

function displayCategoriesInSidebar(categories) {
    const list = document.getElementById('categoryList');
    list.innerHTML = '';

    categories.forEach(category => {
        const li = document.createElement('li');
        li.textContent = category.name;
        li.onclick = () => showCategoryPosts(category.id, category.name);
        list.appendChild(li);
    });
}



function renderUserProfile(user) {
    document.getElementById('userProfileInfo').innerHTML = `
        <div class="user-info">
            <div class="user-detail">
                <span class="detail-label">ID:</span>
                <span>${user.id}</span>
            </div>
            <div class="user-detail">
                <span class="detail-label">Имя:</span>
                <span id="displayUsername">${user.username}</span>
                <input type="text" id="editUsername" value="${user.username}" class="hidden">
            </div>
            <div class="user-detail">
                <span class="detail-label">Email:</span>
                <span id="displayEmail">${user.email}</span>
                <input type="email" id="editEmail" value="${user.email}" class="hidden">
            </div>
            <div class="user-detail">
                <span class="detail-label">Дата регистрации:</span>
                <span>${new Date(user.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
            <div class="user-actions">
                <button id="editProfileBtn" onclick="enableEditMode()">Изменить данные</button>
                <div id="editControls" class="hidden">
                    <button onclick="updateProfile()">Сохранить</button>
                    <button onclick="disableEditMode()">Отмена</button>
                </div>
                <button onclick="
                ()" class="logout-btn">Выйти</button>
            </div>
        </div>
    `;
}







// Основные функции профиля
async function loadAccountInfo() {
    if (!currentUser) return;

    try {
        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            }
        });

        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            displayUserProfile(user);
            await loadUserPosts();
        }
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        showToast('Ошибка загрузки профиля', 'error');
    }
}

function displayUserProfile(user) {
    // Заполняем данные профиля
    document.getElementById('profileId').textContent = user.id;
    document.getElementById('profileUsername').textContent = user.username;
    document.getElementById('profileEmail').textContent = user.email;
    document.getElementById('profileRegDate').textContent =
        new Date(user.registered).toLocaleDateString('ru-RU');

    // Устанавливаем значения для полей редактирования
    document.getElementById('editUsername').value = user.username;
    document.getElementById('editEmail').value = user.email;
}

// Функции редактирования профиля
function toggleEditMode(enable) {
    const displayElements = [
        document.getElementById('profileUsername'),
        document.getElementById('profileEmail')
    ];
    const editElements = [
        document.getElementById('editUsername'),
        document.getElementById('editEmail')
    ];
    const editBtn = document.getElementById('editProfileBtn');
    const editControls = document.getElementById('editControls');

    if (enable) {
        displayElements.forEach(el => el.classList.add('hidden'));
        editElements.forEach(el => el.classList.remove('hidden'));
        editBtn.classList.add('hidden');
        editControls.classList.remove('hidden');
    } else {
        displayElements.forEach(el => el.classList.remove('hidden'));
        editElements.forEach(el => el.classList.add('hidden'));
        editBtn.classList.remove('hidden');
        editControls.classList.add('hidden');
    }
}

async function updateProfile() {
    try {
        const newUsername = document.getElementById('editUsername').value.trim();
        const newEmail = document.getElementById('editEmail').value.trim();
        const newPassword = document.getElementById('editPassword').value.trim();

        // Валидация
        if (!newUsername || !newEmail) {
            showToast('Все поля обязательны для заполнения', 'error');
            return;
        }

        // Если пароль введен, добавляем его в запрос
        const dataToSend = {
            username: newUsername,
            email: newEmail,
        };

        if (newPassword) {
            dataToSend.password = newPassword;  // добавляем пароль, если он не пуст
        }

        const response = await fetch(`${API_BASE}/users/update/${currentUser.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('access_token')}`
            },
            body: JSON.stringify(dataToSend)
        });

        if (response.ok) {
            const updatedUser = await response.json();
            currentUser = updatedUser;
            toggleEditMode(false);
            displayUserProfile(updatedUser);
            showToast('Данные успешно обновлены');
        } else {
            const error = await response.json();
            showToast(`Ошибка: ${error.detail || 'Неизвестная ошибка'}`, 'error');
        }
    } catch (error) {
        console.error('Ошибка обновления профиля:', error);
        showToast('Ошибка при обновлении профиля', 'error');
    }
}


// Вспомогательные функции
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Инициализация обработчиков событий
function initProfileEvents() {
    document.getElementById('editProfileBtn')?.addEventListener('click', () => toggleEditMode(true));
    document.querySelector('.save-btn')?.addEventListener('click', updateProfile);
    document.querySelector('.cancel-btn')?.addEventListener('click', () => toggleEditMode(false));
}

// При загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initProfileEvents();
    checkAuthStatus(); // Ваша функция проверки авторизации
});

// Вспомогательные функции
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    checkAuthStatus();
});

// Поиск
async function searchPosts() {
    const query = document.getElementById('postSearch').value.trim();
    if (query.length < 2) {
        loadAllPosts();
        return;
    }
    try {
        const response = await fetch(`${API_BASE}/posts/search/?search_query=${encodeURIComponent(query)}`);
        if (!response.ok) throw new Error('Ошибка поиска');
        const posts = await response.json();
        displayPosts(posts, 'postsContainer');
    } catch (error) {
        console.error('Ошибка поиска:', error);
    }
}

async function searchCategories() {
    const query = document.getElementById('categorySearch').value.trim();
    if (query.length < 2) {
        loadAllCategories();
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/categories/`);
        if (!response.ok) throw new Error('Ошибка загрузки категорий');
        const allCategories = await response.json();
        const filtered = allCategories.filter(cat =>
            cat.name.toLowerCase().includes(query.toLowerCase()) ||
            (cat.description && cat.description.toLowerCase().includes(query.toLowerCase()))
        );
        displayCategories(filtered);
    } catch (error) {
        console.error('Ошибка поиска:', error);
    }
}

// Авторизация
async function checkAuthStatus() {
    try {
        const token = localStorage.getItem('access_token');
        if (!token) {
            updateAuthUI(false);
            return;
        }

        const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const user = await response.json();
            currentUser = user;
            updateAuthUI(true);

            // Кэшируем имя автора
            authorsCache[user.id] = user.username;
        } else {
            updateAuthUI(false);
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        updateAuthUI(false);
    }
}

async function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value.trim();
    const errorElement = document.getElementById('loginError');

    if (!username || !password) {
        errorElement.textContent = 'Заполните все поля';
        errorElement.style.display = 'block';
        return;
    }

    try {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: formData
        });

        if (response.ok) {
            const tokenData = await response.json();
            localStorage.setItem('access_token', tokenData.access_token);

            hideModal('loginModal');
            checkAuthStatus();
            showMainPage();
        } else {
            const errorData = await response.json();
            errorElement.textContent = errorData.detail || 'Неверные данные для входа';
            errorElement.style.display = 'block';
        }
    } catch (error) {
        console.error('Ошибка входа:', error);
        errorElement.textContent = 'Ошибка при подключении к серверу';
        errorElement.style.display = 'block';
    }
}

async function register() {
    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value.trim();
    const errorElement = document.getElementById('registerError');

    if (!username || !email || !password) {
        errorElement.textContent = 'Заполните все поля';
        errorElement.style.display = 'block';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                email: email,
                password: password
            })
        });

        if (response.ok) {
            errorElement.textContent = 'Регистрация успешна! Теперь войдите.';
            errorElement.style.color = 'green';
            errorElement.style.display = 'block';

            // Очищаем поля
            document.getElementById('registerUsername').value = '';
            document.getElementById('registerEmail').value = '';
            document.getElementById('registerPassword').value = '';

            // Переключаем на форму входа через 2 секунды
            setTimeout(() => {
                errorElement.style.color = '';
                errorElement.style.display = 'none';
                switchToLogin();
            }, 2000);
        } else {
            const errorData = await response.json();
            errorElement.textContent = errorData.detail || 'Ошибка регистрации';
            errorElement.style.display = 'block';
        }
    } catch (error) {
        console.error('Ошибка регистрации:', error);
        errorElement.textContent = 'Ошибка при подключении к серверу';
        errorElement.style.display = 'block';
    }
}

async function logout() {
    try {
        localStorage.removeItem('access_token');
        currentUser = null;
        authorsCache = {};
        updateAuthUI(false);
        showMainPage();
    } catch (error) {
        console.error('Ошибка выхода:', error);
    }
}

function updateAuthUI(isAuthenticated) {

    document.getElementById('loginLink').style.display = isAuthenticated ? 'none' : 'inline';
    document.getElementById('registerLink').style.display = isAuthenticated ? 'none' : 'inline';
    document.getElementById('accountLink').style.display = isAuthenticated ? 'inline' : 'none';
    document.getElementById('logoutLink').style.display = isAuthenticated ? 'inline' : 'none';
    document.getElementById('myPostsLink').style.display = isAuthenticated ? 'block' : 'none';
    document.getElementById('createPostBtn').style.display = isAuthenticated ? 'inline-block' : 'none';

    if (isAuthenticated) {
        document.getElementById('accountLink').textContent = "Профиль";
    }
}

// Управление постами
async function createPost() {
    if (!currentUser) return;

    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const categoryId = document.getElementById('postCategory').value;

    if (!title || !content || !categoryId) {
        alert('Заполните все поля');
        return;
    }

    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE}/posts/new`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                title: title,
                content: content,
                category_id: parseInt(categoryId)
            })
        });

        if (response.ok) {
            const post = await response.json();
            alert('Пост успешно создан!');
            showPostsPage();
        } else {
            const error = await response.json();
            alert(`Ошибка создания поста: ${error.detail || 'Неизвестная ошибка'}`);
        }
    } catch (error) {
        console.error('Ошибка создания поста:', error);
        alert('Ошибка при создании поста');
    }
}

async function deletePost(postId) {
    if (!currentUser || !confirm('Вы уверены, что хотите удалить этот пост?')) {
        return;
    }

    try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(`${API_BASE}/posts/delete/${postId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            alert('Пост успешно удален');
            if (currentCategoryId) {
                showCategoryPosts(currentCategoryId);
            } else {
                showPostsPage();
            }
        } else {
            const error = await response.json();
            alert(`Ошибка удаления: ${error.detail || 'Неизвестная ошибка'}`);
        }
    } catch (error) {
        console.error('Ошибка удаления поста:', error);
        alert('Ошибка при удалении поста');
    }
}