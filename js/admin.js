// File: js/admin.js (Updated)

// Load admin dashboard data dengan error handling
async function loadAdminDashboardData() {
    try {
        // Verifikasi admin access
        const isAdmin = await requireAdmin();
        if (!isAdmin) return;
        
        // Load user profile
        const userData = await getUserData();
        if (userData) {
            document.getElementById('adminName').textContent = userData.nama;
        }
        
        // Load statistics
        await loadStatistics();
        
        // Load recent activity
        await loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        alert('Gagal memuat data dashboard: ' + error.message);
    }
}

// Load users dengan error handling
async function loadUsers() {
    try {
        const isAdmin = await requireAdmin();
        if (!isAdmin) return;
        
        const usersSnapshot = await db.collection('users')
            .orderBy('createdAt', 'desc')
            .get();
        
        const usersList = document.getElementById('usersList');
        if (!usersList) return;
        
        usersList.innerHTML = '';
        
        if (usersSnapshot.empty) {
            usersList.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 2rem;">
                        Tidak ada data karyawan
                    </td>
                </tr>
            `;
            return;
        }
        
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${user.nip || 'N/A'}</td>
                <td>${user.nama || 'N/A'}</td>
                <td>${user.jabatan || 'N/A'}</td>
                <td>${user.noWhatsapp || 'N/A'}</td>
                <td>${user.wilayah || 'N/A'}</td>
                <td>${user.passwordDisplay || 'N/A'}</td>
                <td>
                    <button onclick="editUser('${doc.id}')" class="btn-edit">Edit</button>
                    <button onclick="deleteUser('${doc.id}')" class="btn-delete">Hapus</button>
                </td>
            `;
            
            usersList.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading users:', error);
        showError('Gagal memuat data karyawan: ' + error.message);
    }
}

// Helper function untuk show error
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert error';
    errorDiv.textContent = message;
    
    // Insert di awal content
    const content = document.querySelector('.main-content');
    if (content) {
        content.insertBefore(errorDiv, content.firstChild);
    }
}

// Initialize admin pages dengan error handling
document.addEventListener('DOMContentLoaded', async function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    try {
        if (currentPage === 'admin-dashboard.html') {
            await loadAdminDashboardData();
        } else if (currentPage === 'admin-users.html') {
            await loadUsers();
        } else if (currentPage === 'admin-attendance.html') {
            await loadAttendanceData();
        }
    } catch (error) {
        console.error('Error initializing page:', error);
    }
});
