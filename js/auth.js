// Update di file js/auth.js

// Fungsi login yang sudah ada, TIDAK PERLU diubah
window.loginUser = async function(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
        // Redirect akan dilakukan oleh onAuthStateChanged
    } catch (error) {
        console.error('Error logging in:', error);
        alert('Login gagal: ' + error.message);
    }
};

// Update onAuthStateChanged untuk handle admin
auth.onAuthStateChanged((user) => {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (user) {
        // Cek role user dari Firestore
        db.collection('users').doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    
                    // Redirect berdasarkan role
                    if (userData.role === 'admin') {
                        // Jika di halaman auth atau index, redirect ke admin dashboard
                        if (currentPage === 'login.html' || 
                            currentPage === 'register.html' || 
                            currentPage === 'index.html' ||
                            currentPage === '') {
                            window.location.href = 'admin-dashboard.html';
                        }
                    } else {
                        // User biasa
                        if (currentPage === 'login.html' || 
                            currentPage === 'register.html' || 
                            currentPage === 'index.html' ||
                            currentPage === '') {
                            window.location.href = 'user-dashboard.html';
                        }
                    }
                } else {
                    // Jika user tidak ada di Firestore, logout
                    auth.signOut();
                    alert('User tidak ditemukan dalam database!');
                }
            })
            .catch((error) => {
                console.error('Error checking user role:', error);
            });
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
            window.location.href = 'login.html';
        }
    }
});
