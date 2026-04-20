// public/app.js

document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentUser = null;
    let isLoginMode = true;
    let currentEditingPostId = null;
    let currentViewingPostId = null;

    // DOM Elements
    const views = {
        auth: document.getElementById('view-auth'),
        board: document.getElementById('view-board'),
        write: document.getElementById('view-write'),
        detail: document.getElementById('view-post-detail')
    };

    const navUserArea = document.getElementById('nav-user-area');
    const authTitle = document.getElementById('auth-title');
    const authSubmitText = document.getElementById('auth-submit-text');
    const authToggleText = document.getElementById('auth-toggle-text');
    const toggleAuthModeBtn = document.getElementById('toggle-auth-mode');
    const authForm = document.getElementById('auth-form');
    
    const btnNewPost = document.getElementById('btn-new-post');
    const btnBack = document.getElementById('btn-back');
    const postForm = document.getElementById('post-form');
    const postsList = document.getElementById('posts-list');
    const postSubmitBtn = document.getElementById('post-submit-btn');
    const writeTitle = document.getElementById('write-title');

    // Detail View Elements
    const btnBackFromDetail = document.getElementById('btn-back-from-detail');
    const detailTitle = document.getElementById('detail-title');
    const detailAuthor = document.getElementById('detail-author');
    const detailDate = document.getElementById('detail-date');
    const detailContent = document.getElementById('detail-content');
    const postActions = document.getElementById('post-actions');
    const btnEditPost = document.getElementById('btn-edit-post');
    const btnDeletePost = document.getElementById('btn-delete-post');

    // Comment Elements
    const commentsList = document.getElementById('comments-list');
    const commentForm = document.getElementById('comment-form');
    const commentLoginPrompt = document.getElementById('comment-login-prompt');
    const commentSubmitBtn = document.getElementById('comment-submit-btn');
    const linkLoginComment = document.getElementById('link-login-comment');

    // Initialization
    checkAuth();

    // View Management
    function showView(viewName) {
        Object.values(views).forEach(v => v.classList.add('hidden-view'));
        views[viewName].classList.remove('hidden-view');
        
        if (viewName === 'board') {
            loadPosts();
        }
    }

    // Auth Logic
    async function checkAuth() {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                currentUser = data.user;
                updateNav();
                showView('board');
            } else {
                currentUser = null;
                updateNav();
                showView('board'); // Show board to public, but hide write button
            }
        } catch (e) {
            console.error('Auth check failed', e);
            showView('board');
        }
    }

    function updateNav() {
        if (currentUser) {
            navUserArea.innerHTML = `
                <span class="text-white text-sm font-medium mr-4">환영합니다, ${currentUser.username}님</span>
                <button id="btn-logout" class="text-indigo-100 hover:text-white font-medium text-sm transition-colors">로그아웃</button>
            `;
            document.getElementById('btn-logout').addEventListener('click', handleLogout);
            btnNewPost.classList.remove('hidden');
        } else {
            navUserArea.innerHTML = `
                <button id="btn-show-login" class="text-indigo-100 hover:text-white font-medium text-sm transition-colors">로그인 / 회원가입</button>
            `;
            document.getElementById('btn-show-login').addEventListener('click', () => showView('auth'));
            btnNewPost.classList.add('hidden');
        }
    }

    toggleAuthModeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        isLoginMode = !isLoginMode;
        if (isLoginMode) {
            authTitle.textContent = '로그인';
            authSubmitText.textContent = '로그인';
            authToggleText.textContent = "계정이 없으신가요?";
            toggleAuthModeBtn.textContent = '회원가입';
        } else {
            authTitle.textContent = '회원가입';
            authSubmitText.textContent = '가입하기';
            authToggleText.textContent = '이미 계정이 있으신가요?';
            toggleAuthModeBtn.textContent = '로그인';
        }
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = authForm.username.value;
        const password = authForm.password.value;
        const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';

        try {
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (res.ok) {
                if (!isLoginMode) {
                    alert('회원가입이 완료되었습니다! 로그인해주세요.');
                    isLoginMode = true;
                    toggleAuthModeBtn.click(); // toggle back to login
                    authForm.reset();
                } else {
                    await checkAuth();
                    authForm.reset();
                }
            } else {
                alert(data.error || '인증에 실패했습니다.');
            }
        } catch (error) {
            alert('네트워크 오류가 발생했습니다.');
        }
    });

    async function handleLogout() {
        try {
            await fetch('/api/auth/me', { method: 'DELETE' });
            currentUser = null;
            updateNav();
            showView('board');
        } catch (e) {
            console.error('Logout failed', e);
        }
    }

    // Board Logic
    async function loadPosts() {
        try {
            const res = await fetch('/api/posts');
            if (res.ok) {
                const posts = await res.json();
                renderPosts(posts);
            } else {
                postsList.innerHTML = '<li class="p-8 text-center text-red-500">게시물을 불러오는데 실패했습니다.</li>';
            }
        } catch (e) {
            postsList.innerHTML = '<li class="p-8 text-center text-red-500">네트워크 오류가 발생했습니다.</li>';
        }
    }

    function renderPosts(posts) {
        if (posts.length === 0) {
            postsList.innerHTML = '<li class="p-8 text-center text-gray-500">아직 작성된 게시물이 없습니다. 첫 게시물을 작성해보세요!</li>';
            return;
        }

        postsList.innerHTML = posts.map(post => {
            const date = new Date(post.created_at).toLocaleString();
            return `
            <li class="p-6 hover:bg-gray-50 transition-colors cursor-pointer" onclick="viewPost(${post.id})">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h3 class="text-xl font-bold text-gray-900 mb-2">${escapeHtml(post.title)}</h3>
                    </div>
                </div>
                <div class="mt-4 flex items-center text-sm text-gray-500">
                    <span class="font-medium mr-2 text-gray-700">${escapeHtml(post.username)}</span>
                    <span>&bull;</span>
                    <span class="ml-2">${date}</span>
                </div>
            </li>
            `;
        }).join('');
    }

    // Detail View Logic
    window.viewPost = async function(postId) {
        currentViewingPostId = postId;
        try {
            const res = await fetch(`/api/posts/${postId}`);
            if (!res.ok) throw new Error('게시물을 불러오지 못했습니다.');
            const data = await res.json();
            
            detailTitle.textContent = data.post.title;
            detailAuthor.textContent = data.post.username;
            detailDate.textContent = new Date(data.post.created_at).toLocaleString();
            detailContent.textContent = data.post.content;

            if (currentUser && Number(currentUser.id) === Number(data.post.user_id)) {
                postActions.classList.remove('hidden');
                // Store post data in buttons for easy editing
                btnEditPost.dataset.title = data.post.title;
                btnEditPost.dataset.content = data.post.content;
            } else {
                postActions.classList.add('hidden');
            }

            renderComments(data.comments);

            if (currentUser) {
                commentForm.classList.remove('hidden');
                commentLoginPrompt.classList.add('hidden');
            } else {
                commentForm.classList.add('hidden');
                commentLoginPrompt.classList.remove('hidden');
            }

            showView('detail');
        } catch (error) {
            alert(error.message);
        }
    };

    btnBackFromDetail.addEventListener('click', () => {
        showView('board');
        currentViewingPostId = null;
    });

    btnEditPost.addEventListener('click', () => {
        currentEditingPostId = currentViewingPostId;
        writeTitle.textContent = '게시물 수정';
        document.getElementById('post-title').value = btnEditPost.dataset.title;
        document.getElementById('post-content').value = btnEditPost.dataset.content;
        postSubmitBtn.textContent = '수정 완료';
        showView('write');
    });

    btnDeletePost.addEventListener('click', async () => {
        if (!confirm('정말로 이 게시물을 삭제하시겠습니까?')) return;
        try {
            const res = await fetch(`/api/posts/${currentViewingPostId}`, { method: 'DELETE' });
            if (res.ok) {
                alert('게시물이 삭제되었습니다.');
                showView('board');
            } else {
                const errData = await res.json();
                throw new Error(errData.error || '삭제 실패');
            }
        } catch (error) {
            alert(error.message);
        }
    });

    // Post Creation / Editing Logic
    btnNewPost.addEventListener('click', () => {
        currentEditingPostId = null;
        postForm.reset();
        writeTitle.textContent = '새 게시물 작성';
        postSubmitBtn.textContent = '등록하기';
        showView('write');
    });

    btnBack.addEventListener('click', () => {
        if (currentEditingPostId) {
            showView('detail');
        } else {
            showView('board');
        }
    });

    postForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        postSubmitBtn.disabled = true;
        const originalText = postSubmitBtn.textContent;
        postSubmitBtn.textContent = '처리 중...';

        try {
            const title = document.getElementById('post-title').value;
            const content = document.getElementById('post-content').value;

            postSubmitBtn.textContent = '저장 중...';
            
            let postRes;
            if (currentEditingPostId) {
                // Edit Post
                postRes = await fetch(`/api/posts/${currentEditingPostId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, content })
                });
            } else {
                // Create Post
                postRes = await fetch('/api/posts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ title, content })
                });
            }

            if (!postRes.ok) {
                const errData = await postRes.json();
                throw new Error(errData.error || '저장에 실패했습니다.');
            }

            postForm.reset();
            if (currentEditingPostId) {
                viewPost(currentEditingPostId);
            } else {
                showView('board');
            }

        } catch (error) {
            alert(error.message);
        } finally {
            postSubmitBtn.disabled = false;
            postSubmitBtn.textContent = originalText;
        }
    });

    // Comments Logic
    function renderComments(comments) {
        if (comments.length === 0) {
            commentsList.innerHTML = '<li class="text-gray-500 text-center py-4">아직 댓글이 없습니다.</li>';
            return;
        }
        commentsList.innerHTML = comments.map(c => `
            <li class="bg-gray-50 rounded-lg p-4">
                <div class="flex justify-between items-center mb-2">
                    <span class="font-medium text-gray-900">${escapeHtml(c.username)}</span>
                    <span class="text-sm text-gray-500">${new Date(c.created_at).toLocaleString()}</span>
                </div>
                <p class="text-gray-800 whitespace-pre-wrap">${escapeHtml(c.content)}</p>
            </li>
        `).join('');
    }

    commentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const content = document.getElementById('comment-content').value;
        if (!content.trim()) return;

        commentSubmitBtn.disabled = true;
        try {
            const res = await fetch(`/api/posts/${currentViewingPostId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content })
            });

            if (res.ok) {
                document.getElementById('comment-content').value = '';
                // Reload post to see new comment
                viewPost(currentViewingPostId);
            } else {
                throw new Error('댓글 작성에 실패했습니다.');
            }
        } catch (error) {
            alert(error.message);
        } finally {
            commentSubmitBtn.disabled = false;
        }
    });

    linkLoginComment.addEventListener('click', (e) => {
        e.preventDefault();
        showView('auth');
    });

    function escapeHtml(unsafe) {
        return (unsafe || '').toString()
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }
});
