
// File: js/admin.js

// Load admin dashboard data
async function loadAdminDashboardData() {
    try {
        const user = auth.currentUser;
        if (!user) return;

        // Update admin name
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            document.getElementById('adminName').textContent = userDoc.data().nama;
        }

        // Load statistics
        await loadStatistics();
        
        // Load recent activity
        await loadRecentActivity();
        
    } catch (error) {
        console.error('Error loading dashboard data:', error);
    }
}

// Load statistics
async function loadStatistics() {
    try {
        // Total employees
        const usersSnapshot = await db.collection('users').where('role', '==', 'user').get();
        document.getElementById('totalEmployees').textContent = usersSnapshot.size;
        
        // Today's date
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Present today
        const attendanceSnapshot = await db.collection('attendance')
            .where('date', '==', todayStr)
            .get();
        
        let presentCount = 0;
        let lateCount = 0;
        
        attendanceSnapshot.forEach(doc => {
            if (doc.data().status === 'Hadir') presentCount++;
            if (doc.data().status === 'Terlambat') lateCount++;
        });
        
        document.getElementById('presentToday').textContent = presentCount;
        document.getElementById('lateToday').textContent = lateCount;
        document.getElementById('totalAttendance').textContent = attendanceSnapshot.size;
        
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
}

// Load recent activity
async function loadRecentActivity() {
    try {
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        
        const attendanceSnapshot = await db.collection('attendance')
            .where('timestamp', '>=', sevenDaysAgo)
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();
        
        const tableBody = document.querySelector('#recentActivityTable tbody');
        tableBody.innerHTML = '';
        
        for (const doc of attendanceSnapshot.docs) {
            const data = doc.data();
            
            // Get user data
            const userDoc = await db.collection('users').doc(data.userId).get();
            const userData = userDoc.data();
            
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${userData?.nama || 'Unknown'}</td>
                <td>${formatDate(data.date)}</td>
                <td>${data.time}</td>
                <td>${data.shift}</td>
                <td><span class="status ${data.status.toLowerCase()}">${data.status}</span></td>
                <td>
                    <a href="https://www.google.com/maps?q=${data.latitude},${data.longitude}" 
                       target="_blank" class="btn-location">
                        Lihat Lokasi
                    </a>
                </td>
            `;
            
            tableBody.appendChild(row);
        }
        
    } catch (error) {
        console.error('Error loading recent activity:', error);
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

// Manage Users Page
async function loadUsers() {
    try {
        const usersSnapshot = await db.collection('users')
            .where('role', '==', 'user')
            .orderBy('createdAt', 'desc')
            .get();
        
        const usersList = document.getElementById('usersList');
        if (!usersList) return;
        
        usersList.innerHTML = '';
        
        usersSnapshot.forEach(doc => {
            const user = doc.data();
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${user.nip}</td>
                <td>${user.nama}</td>
                <td>${user.jabatan}</td>
                <td>${user.noWhatsapp}</td>
                <td>${user.wilayah}</td>
                <td>${user.passwordDisplay}</td>
                <td>
                    <button onclick="editUser('${doc.id}')" class="btn-edit">Edit</button>
                    <button onclick="deleteUser('${doc.id}')" class="btn-delete">Hapus</button>
                </td>
            `;
            
            usersList.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

// Edit user
async function editUser(userId) {
    try {
        const userDoc = await db.collection('users').doc(userId).get();
        const user = userDoc.data();
        
        // Show edit modal
        const newNip = prompt('Masukkan NIP baru:', user.nip);
        const newNama = prompt('Masukkan nama baru:', user.nama);
        const newJabatan = prompt('Masukkan jabatan baru:', user.jabatan);
        const newPassword = prompt('Masukkan password baru (kosongkan jika tidak ingin mengubah):', '');
        
        if (newNip && newNama && newJabatan) {
            const updateData = {
                nip: newNip,
                nama: newNama,
                jabatan: newJabatan
            };
            
            if (newPassword) {
                updateData.passwordDisplay = newPassword;
            }
            
            await db.collection('users').doc(userId).update(updateData);
            alert('Data berhasil diperbarui!');
            loadUsers();
        }
        
    } catch (error) {
        console.error('Error editing user:', error);
        alert('Gagal mengedit user: ' + error.message);
    }
}

// Delete user
async function deleteUser(userId) {
    if (!confirm('Apakah Anda yakin ingin menghapus user ini?')) return;
    
    try {
        // Delete from Firestore
        await db.collection('users').doc(userId).delete();
        
        // Delete user's attendance records
        const attendanceSnapshot = await db.collection('attendance')
            .where('userId', '==', userId)
            .get();
        
        const batch = db.batch();
        attendanceSnapshot.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        
        alert('User berhasil dihapus!');
        loadUsers();
        
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Gagal menghapus user: ' + error.message);
    }
}

// Load attendance data for admin
async function loadAttendanceData() {
    try {
        const attendanceSnapshot = await db.collection('attendance')
            .orderBy('timestamp', 'desc')
            .limit(50)
            .get();
        
        const attendanceList = document.getElementById('attendanceList');
        if (!attendanceList) return;
        
        attendanceList.innerHTML = '';
        
        for (const doc of attendanceSnapshot.docs) {
            const data = doc.data();
            const userDoc = await db.collection('users').doc(data.userId).get();
            const userData = userDoc.data();
            
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${userData?.nip || 'N/A'}</td>
                <td>${userData?.nama || 'Unknown'}</td>
                <td>${formatDate(data.date)}</td>
                <td>${data.time}</td>
                <td>${data.shift}</td>
                <td>${data.area}</td>
                <td><span class="status ${data.status.toLowerCase()}">${data.status}</span></td>
                <td>
                    <img src="${data.photoUrl}" alt="Foto" style="width: 50px; height: 50px; object-fit: cover; border-radius: 5px;" 
                         onclick="showImage('${data.photoUrl}')">
                </td>
                <td>
                    <a href="https://www.google.com/maps?q=${data.latitude},${data.longitude}" 
                       target="_blank" class="btn-location">
                        Lihat Lokasi
                    </a>
                </td>
            `;
            
            attendanceList.appendChild(row);
        }
        
    } catch (error) {
        console.error('Error loading attendance data:', error);
    }
}

// Show image in modal
function showImage(imageUrl) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
    `;
    
    modal.innerHTML = `
        <img src="${imageUrl}" style="max-width: 90%; max-height: 90%;">
        <button onclick="this.parentElement.remove()" 
                style="position: absolute; top: 20px; right: 20px; background: #ff0000; color: white; border: none; padding: 10px; cursor: pointer;">
            X
        </button>
    `;
    
    document.body.appendChild(modal);
}

// Initialize admin pages
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'admin-dashboard.html') {
        loadAdminDashboardData();
    } else if (currentPage === 'admin-users.html') {
        loadUsers();
    } else if (currentPage === 'admin-attendance.html') {
        loadAttendanceData();
    }
});
// Tambahkan di admin.js

// Fungsi untuk membuat user admin baru
async function createNewAdmin() {
    try {
        const nip = prompt('Masukkan NIP untuk admin baru:');
        const nama = prompt('Masukkan nama admin baru:');
        const email = `${nip}@absensi.com`;
        const password = prompt('Masukkan password untuk admin baru:');
        
        if (!nip || !nama || !password) {
            alert('Semua field harus diisi!');
            return;
        }
        
        // Buat user di Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Simpan data admin di Firestore
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            nip: nip,
            nama: nama,
            jabatan: 'Administrator',
            alamat: 'Kantor Pusat',
            noWhatsapp: '-',
            wilayah: 'Pusat',
            email: email,
            role: 'admin',
            passwordDisplay: password,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        alert(`Admin baru berhasil dibuat!\nEmail: ${email}\nPassword: ${password}`);
        loadUsers();
        
    } catch (error) {
        console.error('Error creating admin:', error);
        alert('Gagal membuat admin: ' + error.message);
    }
}
