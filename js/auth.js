// File: js/auth.js (Updated)

// Check auth state
auth.onAuthStateChanged(async (user) => {
    const currentPage = window.location.pathname.split('/').pop();
    console.log('Auth state changed:', user ? 'User logged in' : 'No user');
    
    // Jika user sudah login dan di halaman auth
    if (user) {
        try {
            // Cek apakah data user ada di Firestore
            const userDoc = await db.collection('users').doc(user.uid).get();
            console.log('User document exists:', userDoc.exists);
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                console.log('User data:', userData);
                
                // Simpan data user di sessionStorage untuk akses cepat
                sessionStorage.setItem('userData', JSON.stringify(userData));
                
                // Redirect berdasarkan role
                if (userData.role === 'admin') {
                    if (currentPage === 'login.html' || 
                        currentPage === 'register.html' || 
                        currentPage === 'index.html' ||
                        currentPage === '') {
                        window.location.href = 'admin-dashboard.html';
                    }
                } else {
                    if (currentPage === 'login.html' || 
                        currentPage === 'register.html' || 
                        currentPage === 'index.html' ||
                        currentPage === '') {
                        window.location.href = 'user-dashboard.html';
                    }
                }
            } else {
                console.error('User data not found in Firestore');
                // Logout karena data tidak konsisten
                await auth.signOut();
                sessionStorage.removeItem('userData');
                
                if (currentPage !== 'login.html' && currentPage !== 'register.html') {
                    alert('Data user tidak ditemukan. Silakan login kembali.');
                    window.location.href = 'login.html';
                }
            }
        } catch (error) {
            console.error('Error checking user data:', error);
            await auth.signOut();
            sessionStorage.removeItem('userData');
            
            if (currentPage !== 'login.html' && currentPage !== 'register.html') {
                alert('Terjadi kesalahan. Silakan login kembali.');
                window.location.href = 'login.html';
            }
        }
    } else {
        // Jika user belum login dan di halaman protected
        const protectedPages = [
            'admin-dashboard.html', 
            'user-dashboard.html', 
            'admin-users.html', 
            'admin-attendance.html', 
            'user-attendance.html', 
            'user-profile.html'
        ];
        
        if (protectedPages.includes(currentPage)) {
            console.log('Protected page accessed without login, redirecting...');
            window.location.href = 'login.html';
        }
    }
});

// Fungsi untuk mendapatkan data user dengan error handling
async function getUserData() {
    try {
        const user = auth.currentUser;
        if (!user) return null;
        
        // Coba ambil dari sessionStorage dulu
        const cachedData = sessionStorage.getItem('userData');
        if (cachedData) {
            return JSON.parse(cachedData);
        }
        
        // Ambil dari Firestore
        const userDoc = await db.collection('users').doc(user.uid).get();
        if (userDoc.exists) {
            const userData = userDoc.data();
            sessionStorage.setItem('userData', JSON.stringify(userData));
            return userData;
        }
        
        return null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

// Fungsi register (diperbarui)
window.registerUser = async function(event) {
    event.preventDefault();
    
    const nip = document.getElementById('nip').value;
    const nama = document.getElementById('nama').value;
    const jabatan = document.getElementById('jabatan').value;
    const alamat = document.getElementById('alamat').value;
    const noWhatsapp = document.getElementById('noWhatsapp').value;
    const wilayah = document.getElementById('wilayah').value;
    
    // Generate password otomatis
    const password = generateAutoPassword(nip, nama);
    const email = `${nip}@absensi.com`;
    
    try {
        // Cek apakah NIP sudah terdaftar
        const existingUser = await db.collection('users')
            .where('nip', '==', nip)
            .limit(1)
            .get();
        
        if (!existingUser.empty) {
            alert('NIP sudah terdaftar!');
            return;
        }
        
        // Buat user di Firebase Auth
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Simpan data user di Firestore
        await db.collection('users').doc(user.uid).set({
            uid: user.uid,
            nip: nip,
            nama: nama,
            jabatan: jabatan,
            alamat: alamat,
            noWhatsapp: noWhatsapp,
            wilayah: wilayah,
            email: email,
            role: 'user',
            passwordDisplay: password,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Update display name di Firebase Auth
        await user.updateProfile({
            displayName: nama
        });
        
        // Show success message
        alert(`Registrasi berhasil!\n\nEmail: ${email}\nPassword: ${password}\n\nSilakan login dengan email dan password di atas.`);
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('Error registering:', error);
        
        // Handle specific errors
        if (error.code === 'auth/email-already-in-use') {
            alert('Email/NIP sudah digunakan!');
        } else if (error.code === 'auth/weak-password') {
            alert('Password terlalu lemah! Minimal 6 karakter.');
        } else if (error.code === 'auth/invalid-email') {
            alert('Format email tidak valid!');
        } else {
            alert('Registrasi gagal: ' + error.message);
        }
    }
};

// Fungsi login (diperbarui)
window.loginUser = async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    // Clear previous session data
    sessionStorage.removeItem('userData');
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        // Redirect akan dilakukan oleh onAuthStateChanged
    } catch (error) {
        console.error('Error logging in:', error);
        
        // Handle specific errors
        if (error.code === 'auth/user-not-found') {
            alert('User tidak ditemukan!');
        } else if (error.code === 'auth/wrong-password') {
            alert('Password salah!');
        } else if (error.code === 'auth/invalid-email') {
            alert('Format email tidak valid!');
        } else {
            alert('Login gagal: ' + error.message);
        }
    }
};

// Fungsi logout (diperbarui)
window.logout = async function() {
    try {
        await auth.signOut();
        sessionStorage.clear(); // Clear semua session data
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error logging out:', error);
        alert('Logout gagal: ' + error.message);
    }
};

// Generate password otomatis
function generateAutoPassword(nip, nama) {
    const nipPart = nip.slice(-4);
    const namaPart = nama.slice(-3).toUpperCase();
    return `${nipPart}${namaPart}`;
}

// Export fungsi untuk akses global
window.getUserData = getUserData;
