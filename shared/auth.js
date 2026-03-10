// auth.js — Sarah's Assistant auth module
// Google OAuth sign-in + page guard + profile widget
//
// Usage:
//   1. Include Supabase CDN + supabase.js + auth.js on every page
//   2. On public pages: auth widget auto-inserts into .site-nav__inner (or first <nav>)
//   3. On admin pages: call requireAuth(callback) to guard access
//   4. Use window.adminSupabase for authenticated Supabase calls
//
(function() {
    'use strict';

    if (typeof window.supabase === 'undefined') {
        console.warn('[auth] Supabase JS SDK not loaded');
        return;
    }

    var url  = window.SUPABASE_URL;
    var key  = window.SUPABASE_ANON_KEY;
    if (!url || !key) {
        console.warn('[auth] SUPABASE_URL or SUPABASE_ANON_KEY not defined.');
        return;
    }

    var sb = window.supabase.createClient(url, key);
    var currentUser = null;

    // =============================================
    // HELPERS
    // =============================================

    function getInitials(name) {
        if (!name) return '?';
        var parts = name.trim().split(/\s+/);
        return parts.length >= 2
            ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
            : name[0].toUpperCase();
    }

    function escapeHtml(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function showToast(message, type) {
        var existing = document.querySelector('.toast-notification');
        if (existing) existing.remove();
        var toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.style.cssText = 'position:fixed;top:80px;left:50%;transform:translateX(-50%) translateY(-10px);z-index:10000;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:500;font-family:inherit;max-width:90vw;text-align:center;opacity:0;transition:all 0.3s ease;box-shadow:0 8px 32px rgba(0,0,0,0.12);';
        if (type === 'success') { toast.style.background = '#f0fdf4'; toast.style.color = '#166534'; toast.style.border = '1px solid #bbf7d0'; }
        else if (type === 'error')  { toast.style.background = '#fef2f2'; toast.style.color = '#991b1b'; toast.style.border = '1px solid #fecaca'; }
        else { toast.style.background = '#fffbeb'; toast.style.color = '#92400e'; toast.style.border = '1px solid #fde68a'; }
        toast.textContent = message;
        document.body.appendChild(toast);
        requestAnimationFrame(function() { toast.style.opacity = '1'; toast.style.transform = 'translateX(-50%) translateY(0)'; });
        setTimeout(function() { toast.style.opacity = '0'; toast.style.transform = 'translateX(-50%) translateY(-10px)'; setTimeout(function() { toast.remove(); }, 300); }, 4000);
    }

    // =============================================
    // GOOGLE SIGN-IN
    // =============================================

    function signInWithGoogle() {
        var redirectTo = window.location.origin + window.location.pathname;
        sb.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: redirectTo }
        }).then(function(result) {
            if (result.error) {
                showToast(result.error.message || 'Google sign-in failed', 'error');
            }
            // On success, Supabase redirects the browser — no further action needed
        });
    }

    // =============================================
    // PROFILE BUTTON (NAV)
    // =============================================

    function buildAuthWidget() {
        var wrapper = document.createElement('div');
        wrapper.className = 'auth-widget';
        wrapper.id = 'authWidget';
        return wrapper;
    }

    function renderLoggedOut(wrapper) {
        wrapper.innerHTML =
            '<button class="auth-btn" id="authLoginBtn" aria-label="Sign in" title="Sign in">' +
                '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>' +
                    '<circle cx="12" cy="7" r="4"/>' +
                '</svg>' +
            '</button>';

        wrapper.querySelector('#authLoginBtn').addEventListener('click', function(e) {
            e.stopPropagation();
            openLoginModal();
        });
    }

    function renderLoggedIn(wrapper, user) {
        var displayName = (user.user_metadata && user.user_metadata.full_name) || user.email;
        var avatarUrl   = user.user_metadata && user.user_metadata.avatar_url;
        var initials    = getInitials(displayName);

        var adminHref = 'admin/index.html';
        if (window.location.pathname.indexOf('/admin/') !== -1) adminHref = 'index.html';

        var avatarHtml = avatarUrl
            ? '<img src="' + escapeHtml(avatarUrl) + '" class="auth-avatar auth-avatar--photo" alt="' + escapeHtml(initials) + '">'
            : '<span class="auth-avatar auth-avatar--initials">' + initials + '</span>';

        wrapper.innerHTML =
            '<button class="auth-avatar-btn" id="authAvatarBtn" aria-haspopup="true" aria-expanded="false" title="' + escapeHtml(displayName) + '">' +
                avatarHtml +
            '</button>' +
            '<div class="auth-dropdown" id="authDropdown">' +
                '<div class="auth-dropdown__user">' + escapeHtml(displayName) + '</div>' +
                '<div class="auth-dropdown__divider"></div>' +
                '<a href="' + adminHref + '" class="auth-dropdown__item">' +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>' +
                    '<span>Dashboard</span>' +
                '</a>' +
                '<button class="auth-dropdown__item auth-dropdown__signout" id="authSignOutBtn">' +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' +
                    '<span>Sign Out</span>' +
                '</button>' +
            '</div>';

        var avatarBtn = wrapper.querySelector('#authAvatarBtn');
        var dropdown  = wrapper.querySelector('#authDropdown');

        avatarBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var isOpen = dropdown.classList.contains('auth-dropdown--open');
            dropdown.classList.toggle('auth-dropdown--open', !isOpen);
            avatarBtn.setAttribute('aria-expanded', !isOpen);
        });

        document.addEventListener('click', function() {
            dropdown.classList.remove('auth-dropdown--open');
            avatarBtn.setAttribute('aria-expanded', 'false');
        });

        wrapper.querySelector('#authSignOutBtn').addEventListener('click', function(e) {
            e.stopPropagation();
            sb.auth.signOut().then(function() {
                currentUser = null;
                renderLoggedOut(wrapper);
                showToast('Signed out', 'success');
                if (window.location.pathname.indexOf('/admin/') !== -1) {
                    window.location.href = '../index.html';
                }
            });
        });
    }

    // =============================================
    // LOGIN MODAL
    // =============================================

    function openLoginModal() {
        var existing = document.getElementById('authModal');
        if (existing) existing.remove();

        var modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.id = 'authModal';
        modal.innerHTML =
            '<div class="auth-modal__backdrop" id="authModalBackdrop"></div>' +
            '<div class="auth-modal__card">' +
                '<button class="auth-modal__close" id="authModalClose" aria-label="Close">&times;</button>' +
                '<div class="auth-modal__header">' +
                    '<h2 class="auth-modal__title">Sign In</h2>' +
                    '<p class="auth-modal__subtitle">Sarah\'s Assistant</p>' +
                '</div>' +
                '<div class="auth-modal__body">' +
                    '<button class="auth-google-btn" id="authGoogleBtn">' +
                        '<svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
                            '<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>' +
                            '<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>' +
                            '<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>' +
                            '<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>' +
                        '</svg>' +
                        'Continue with Google' +
                    '</button>' +
                    '<div class="auth-divider"><span>or</span></div>' +
                    '<form class="auth-modal__form" id="authLoginForm">' +
                        '<div class="auth-modal__field">' +
                            '<label for="authEmail">Email</label>' +
                            '<input type="email" id="authEmail" required autocomplete="email" placeholder="you@example.com">' +
                        '</div>' +
                        '<div class="auth-modal__field">' +
                            '<label for="authPassword">Password</label>' +
                            '<input type="password" id="authPassword" required autocomplete="current-password" placeholder="Password">' +
                        '</div>' +
                        '<div class="auth-modal__error" id="authError"></div>' +
                        '<button type="submit" class="auth-modal__submit" id="authSubmitBtn">Sign In</button>' +
                    '</form>' +
                '</div>' +
            '</div>';

        document.body.appendChild(modal);

        document.getElementById('authModalBackdrop').addEventListener('click', closeLoginModal);
        document.getElementById('authModalClose').addEventListener('click', closeLoginModal);
        document.addEventListener('keydown', handleModalEsc);

        document.getElementById('authGoogleBtn').addEventListener('click', function() {
            signInWithGoogle();
            closeLoginModal();
        });

        document.getElementById('authLoginForm').addEventListener('submit', function(e) {
            e.preventDefault();
            var email     = document.getElementById('authEmail').value.trim();
            var password  = document.getElementById('authPassword').value;
            var errorEl   = document.getElementById('authError');
            var submitBtn = document.getElementById('authSubmitBtn');

            errorEl.textContent = '';
            submitBtn.disabled  = true;
            submitBtn.textContent = 'Signing in\u2026';

            sb.auth.signInWithPassword({ email: email, password: password }).then(function(result) {
                if (result.error) {
                    errorEl.textContent = result.error.message || 'Invalid credentials';
                    submitBtn.disabled  = false;
                    submitBtn.textContent = 'Sign In';
                    return;
                }
                currentUser = result.data.user;
                closeLoginModal();
                var widget = document.getElementById('authWidget');
                if (widget) renderLoggedIn(widget, currentUser);
                showToast('Signed in successfully', 'success');
            }).catch(function() {
                errorEl.textContent = 'Something went wrong. Please try again.';
                submitBtn.disabled  = false;
                submitBtn.textContent = 'Sign In';
            });
        });

        requestAnimationFrame(function() { modal.classList.add('auth-modal--open'); });
    }

    function closeLoginModal() {
        var modal = document.getElementById('authModal');
        if (!modal) return;
        modal.classList.remove('auth-modal--open');
        document.removeEventListener('keydown', handleModalEsc);
        setTimeout(function() { modal.remove(); }, 250);
    }

    function handleModalEsc(e) {
        if (e.key === 'Escape') closeLoginModal();
    }

    // =============================================
    // ADMIN PAGE GUARD
    // =============================================

    /**
     * Guard an admin page. Redirects to ../index.html if not authenticated.
     * @param {Function} callback - Called with (user, supabaseClient) when authenticated.
     */
    window.requireAuth = function(callback) {
        sb.auth.getSession().then(function(result) {
            if (result.data.session && result.data.session.user) {
                currentUser = result.data.session.user;
                if (callback) callback(currentUser, sb);
            } else {
                window.location.href = '../index.html';
            }
        });
    };

    // Expose supabase client for admin pages
    window.adminSupabase = sb;

    // =============================================
    // INIT
    // =============================================

    function insertAuthWidget() {
        var navInner = document.querySelector('.site-nav__inner') ||
                       (document.querySelector('nav') && document.querySelector('nav').firstElementChild);
        if (!navInner) return;

        var widget = buildAuthWidget();
        navInner.appendChild(widget);

        sb.auth.getSession().then(function(result) {
            if (result.data.session && result.data.session.user) {
                currentUser = result.data.session.user;
                renderLoggedIn(widget, currentUser);
            } else {
                renderLoggedOut(widget);
            }
        }).catch(function() {
            renderLoggedOut(widget);
        });

        sb.auth.onAuthStateChange(function(event, session) {
            if (event === 'SIGNED_IN' && session && session.user) {
                currentUser = session.user;
                renderLoggedIn(widget, session.user);
            } else if (event === 'SIGNED_OUT') {
                currentUser = null;
                renderLoggedOut(widget);
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', insertAuthWidget);
    } else {
        insertAuthWidget();
    }
})();
