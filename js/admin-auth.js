// File: js/admin-auth.js (buat file baru)

// Middleware untuk halaman admin
async function requireAdmin() {
    try {
        const user = auth.currentUser;
        
        if (!user) {
            window.location.href = 'login.html';
            return false;
        }
        
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (!userDoc.exists || userDoc.data().role !== 'admin') {
            alert('Akses ditolak! Hanya admin yang dapat mengakses halaman ini.');
            window.location.href = 'user-dashboard.html';
            return false;
        }
        
        return true;
        
    } catch (error) {
        console.error('Error checking admin access:', error);
        window.location.href = 'login.html';
        return false;
    }
}

// Tambahkan di setiap halaman admin
document.addEventListener('DOMContentLoaded', async function() {
    const isAdmin = await requireAdmin();
    if (!isAdmin) return;
    
    // Lanjutkan loading halaman jika admin
    // Panggil fungsi lain di sini
});
