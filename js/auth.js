// File: js/auth.js

// Check auth state
auth.onAuthStateChanged((user) => {
    const currentPage = window.location.pathname.split('/').pop();
    
    // Jika user sudah login dan di halaman auth
    if (user && (currentPage === 'login.html' || currentPage === 'register.html' || currentPage === 'index.html')) {
        // Redirect berdasarkan role
        db.collection('users').doc(user.uid).get()
            .then((doc) => {
                if (doc.exists) {
                    const userData = doc.data();
                    if (userData.role === 'admin') {
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        window.location.href = 'user-dashboard.html';
                    }
                }
            });
    }
    
    // Jika user belum login dan di halaman protected
    const protectedPages = ['admin-dashboard.html', 'user-dashboard.html', 'admin-users.html', 
                           'admin-attendance.html', 'user-attendance.html', 'user-profile.html'];
    
    if (!user && protectedPages.includes(currentPage)) {
        window.location.href = 'login.html';
    }
});

// Fungsi register
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
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            passwordDisplay: password // Untuk ditampilkan ke user
        });
        
        // Show success message with password
        alert(`Registrasi berhasil!\nEmail: ${email}\nPassword: ${password}\n\nSilakan login dengan email dan password di atas.`);
        window.location.href = 'login.html';
        
    } catch (error) {
        console.error('Error registering:', error);
        alert('Registrasi gagal: ' + error.message);
    }
};

// Fungsi login
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

// Fungsi logout
window.logout = async function() {
    try {
        await auth.signOut();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error logging out:', error);
    }
};

// Generate password otomatis
function generateAutoPassword(nip, nama) {
    const nipPart = nip.slice(-4);
    const namaPart = nama.slice(-3).toUpperCase();
    return `${nipPart}${namaPart}`;
}
