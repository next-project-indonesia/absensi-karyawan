// File: js/admin-auth.js

// Middleware untuk halaman admin
async function requireAdmin() {
    try {
        // Cek apakah user login
        const user = auth.currentUser;
        if (!user) {
            console.log('No user, redirecting to login');
            window.location.href = 'login.html';
            return false;
        }
        
        // Cek apakah data user ada
        const userData = await getUserData();
        if (!userData) {
            console.log('User data not found, logging out');
            await auth.signOut();
            window.location.href = 'login.html';
            return false;
        }
        
        // Cek role
        if (userData.role !== 'admin') {
            console.log('Not admin, redirecting to user dashboard');
            alert('Akses ditolak! Hanya admin yang dapat mengakses halaman ini.');
            window.location.href = 'user-dashboard.html';
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('Error checking admin access:', error);
        await auth.signOut();
        window.location.href = 'login.html';
        return false;
    }
}

// Middleware untuk halaman user
async function requireUser() {
    try {
        const user = auth.currentUser;
        if (!user) {
            window.location.href = 'login.html';
            return false;
        }
        
        const userData = await getUserData();
        if (!userData) {
            await auth.signOut();
            window.location.href = 'login.html';
            return false;
        }
        
        // Jika admin mengakses halaman user, redirect ke admin dashboard
        if (userData.role === 'admin') {
            const currentPage = window.location.pathname.split('/').pop();
            const userPages = ['user-dashboard.html', 'user-attendance.html', 'user-profile.html'];
            
            if (userPages.includes(currentPage)) {
                window.location.href = 'admin-dashboard.html';
                return false;
            }
        }
        
        return true;
        
    } catch (error) {
        console.error('Error checking user access:', error);
        await auth.signOut();
        window.location.href = 'login.html';
        return false;
    }
}

// Fungsi untuk inisialisasi halaman dengan middleware
async function initAdminPage() {
    const isAuthorized = await requireAdmin();
    if (!isAuthorized) return false;
    
    // Update UI dengan data admin
    const userData = await getUserData();
    if (userData) {
        const adminNameElement = document.getElementById('adminName');
        if (adminNameElement) {
            adminNameElement.textContent = userData.nama;
        }
    }
    
    return true;
}

async function initUserPage() {
    const isAuthorized = await requireUser();
    if (!isAuthorized) return false;
    
    // Update UI dengan data user
    const userData = await getUserData();
    if (userData) {
        const userNameElement = document.getElementById('userName');
        const userPositionElement = document.getElementById('userPosition');
        const userAvatarElement = document.getElementById('userAvatar');
        
        if (userNameElement) userNameElement.textContent = userData.nama;
        if (userPositionElement) userPositionElement.textContent = userData.jabatan;
        if (userAvatarElement) userAvatarElement.textContent = userData.nama.charAt(0);
    }
    
    return true;
}

// Export fungsi
window.requireAdmin = requireAdmin;
window.requireUser = requireUser;
window.initAdminPage = initAdminPage;
window.initUserPage = initUserPage;
