// File: js/user.js

// Load user dashboard data
async function loadUserDashboardData() {
    try {
        const user = auth.currentUser;
        if (!user) return;

        // Load user profile
        await loadUserProfile();
        
        // Load today's attendance status
        await loadTodayAttendanceStatus();
        
        // Load statistics
        await loadUserStatistics();
        
        // Load recent attendance
        await loadRecentAttendance();
        
    } catch (error) {
        console.error('Error loading user dashboard:', error);
    }
}

// Load user profile
async function loadUserProfile() {
    try {
        const user = auth.currentUser;
        const userDoc = await db.collection('users').doc(user.uid).get();
        
        if (userDoc.exists) {
            const userData = userDoc.data();
            
            // Update UI elements
            const userNameElement = document.getElementById('userName');
            const userPositionElement = document.getElementById('userPosition');
            const userAvatarElement = document.getElementById('userAvatar');
            
            if (userNameElement) userNameElement.textContent = userData.nama;
            if (userPositionElement) userPositionElement.textContent = userData.jabatan;
            if (userAvatarElement) userAvatarElement.textContent = userData.nama.charAt(0);
        }
    } catch (error) {
        console.error('Error loading user profile:', error);
    }
}

// Load today's attendance status
async function loadTodayAttendanceStatus() {
    try {
        const user = auth.currentUser;
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const attendanceSnapshot = await db.collection('attendance')
            .where('userId', '==', user.uid)
            .where('date', '==', todayStr)
            .get();
        
        const statusDiv = document.getElementById('attendanceStatus');
        if (!statusDiv) return;
        
        if (attendanceSnapshot.empty) {
            statusDiv.innerHTML = `
                <div class="alert warning">
                    <h3>Anda belum absensi hari ini</h3>
                    <p>Silakan lakukan absensi untuk mencatat kehadiran Anda</p>
                    <a href="user-attendance.html" class="btn btn-primary">Absensi Sekarang</a>
                </div>
            `;
        } else {
            const attendanceData = attendanceSnapshot.docs[0].data();
            const time = attendanceData.time || 'N/A';
            const status = attendanceData.status || 'Hadir';
            
            statusDiv.innerHTML = `
                <div class="alert success">
                    <h3>Anda sudah absensi hari ini</h3>
                    <p><strong>Waktu:</strong> ${time}</p>
                    <p><strong>Shift:</strong> ${attendanceData.shift}</p>
                    <p><strong>Status:</strong> <span class="status ${status.toLowerCase()}">${status}</span></p>
                    <p><strong>Area Kerja:</strong> ${attendanceData.area}</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading attendance status:', error);
    }
}

// Load user statistics
async function loadUserStatistics() {
    try {
        const user = auth.currentUser;
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        
        const attendanceSnapshot = await db.collection('attendance')
            .where('userId', '==', user.uid)
            .where('timestamp', '>=', firstDay)
            .where('timestamp', '<=', lastDay)
            .get();
        
        let presentCount = 0;
        let lateCount = 0;
        let totalCount = attendanceSnapshot.size;
        
        attendanceSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.status === 'Hadir') presentCount++;
            if (data.status === 'Terlambat') lateCount++;
        });
        
        // Calculate working days (assuming 22 days per month)
        const workingDays = 22;
        const attendancePercentage = totalCount > 0 ? Math.round((presentCount / workingDays) * 100) : 0;
        
        // Update UI
        document.getElementById('presentThisMonth').textContent = presentCount;
        document.getElementById('lateThisMonth').textContent = lateCount;
        document.getElementById('totalAttendanceUser').textContent = totalCount;
        document.getElementById('attendancePercentage').textContent = `${attendancePercentage}%`;
        
    } catch (error) {
        console.error('Error loading user statistics:', error);
    }
}

// Load recent attendance
async function loadRecentAttendance() {
    try {
        const user = auth.currentUser;
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        
        const attendanceSnapshot = await db.collection('attendance')
            .where('userId', '==', user.uid)
            .where('timestamp', '>=', sevenDaysAgo)
            .orderBy('timestamp', 'desc')
            .get();
        
        const tableBody = document.querySelector('#recentAttendanceTable tbody');
        if (!tableBody) return;
        
        tableBody.innerHTML = '';
        
        attendanceSnapshot.forEach(doc => {
            const data = doc.data();
            
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${formatDate(data.date)}</td>
                <td>${data.time}</td>
                <td>${data.shift}</td>
                <td>${data.area}</td>
                <td><span class="status ${data.status.toLowerCase()}">${data.status}</span></td>
                <td>
                    <a href="https://www.google.com/maps?q=${data.latitude},${data.longitude}" 
                       target="_blank" class="btn-location">
                        Lihat Lokasi
                    </a>
                </td>
            `;
            
            tableBody.appendChild(row);
        });
        
    } catch (error) {
        console.error('Error loading recent attendance:', error);
    }
}

// Submit attendance
async function submitAttendance(event) {
    event.preventDefault();
    
    try {
        const user = auth.currentUser;
        if (!user) {
            alert('Silakan login terlebih dahulu');
            return;
        }
        
        // Get form values
        const shift = document.getElementById('shift').value;
        const area = document.getElementById('area').value;
        const latitude = document.getElementById('latitude').value;
        const longitude = document.getElementById('longitude').value;
        const photoFile = document.getElementById('photo').files[0];
        
        // Validation
        if (!shift || !area || !latitude || !longitude || !photoFile) {
            alert('Harap lengkapi semua data!');
            return;
        }
        
        // Check if already attendance today
        const today = new Date().toISOString().split('T')[0];
        const existingAttendance = await db.collection('attendance')
            .where('userId', '==', user.uid)
            .where('date', '==', today)
            .get();
        
        if (!existingAttendance.empty) {
            alert('Anda sudah melakukan absensi hari ini!');
            return;
        }
        
        // Upload photo to Firebase Storage
        const storageRef = storage.ref();
        const photoRef = storageRef.child(`attendance/${user.uid}/${Date.now()}_${photoFile.name}`);
        const uploadTask = await photoRef.put(photoFile);
        const photoUrl = await uploadTask.ref.getDownloadURL();
        
        // Determine status (late if after 8 AM)
        const currentTime = new Date();
        const currentHour = currentTime.getHours();
        const status = (currentHour > 8) ? 'Terlambat' : 'Hadir';
        
        // Save attendance data to Firestore
        const attendanceData = {
            userId: user.uid,
            date: today,
            time: currentTime.toLocaleTimeString('id-ID'),
            shift: shift,
            area: area,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            photoUrl: photoUrl,
            status: status,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        await db.collection('attendance').add(attendanceData);
        
        alert('Absensi berhasil!');
        window.location.href = 'user-dashboard.html';
        
    } catch (error) {
        console.error('Error submitting attendance:', error);
        alert('Gagal melakukan absensi: ' + error.message);
    }
}

// Initialize geolocation
function initGeolocation() {
    if (!navigator.geolocation) {
        document.getElementById('locationStatus').textContent = 'Geolocation tidak didukung oleh browser Anda';
        return;
    }
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const latitude = position.coords.latitude;
            const longitude = position.coords.longitude;
            
            document.getElementById('latitude').value = latitude;
            document.getElementById('longitude').value = longitude;
            document.getElementById('locationStatus').textContent = 'Lokasi berhasil dideteksi';
            document.getElementById('locationStatus').style.color = 'green';
        },
        (error) => {
            console.error('Error getting location:', error);
            document.getElementById('locationStatus').textContent = 'Gagal mendapatkan lokasi: ' + error.message;
            document.getElementById('locationStatus').style.color = 'red';
        },
        {
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 0
        }
    );
}

// Initialize camera
async function initCamera() {
    const video = document.getElementById('camera');
    const canvas = document.getElementById('canvas');
    const captureBtn = document.getElementById('captureBtn');
    const photoInput = document.getElementById('photo');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert('Kamera tidak didukung oleh browser Anda');
        return;
    }
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'user' } 
        });
        video.srcObject = stream;
        
        if (captureBtn) {
            captureBtn.addEventListener('click', () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                canvas.getContext('2d').drawImage(video, 0, 0);
                
                // Convert to blob and create file
                canvas.toBlob((blob) => {
                    const file = new File([blob], `selfie_${Date.now()}.jpg`, { type: 'image/jpeg' });
                    
                    // Create a DataTransfer to set the file
                    const dataTransfer = new DataTransfer();
                    dataTransfer.items.add(file);
                    photoInput.files = dataTransfer.files;
                    
                    // Show preview
                    const photoPreview = document.getElementById('photoPreview');
                    const url = URL.createObjectURL(file);
                    photoPreview.innerHTML = `<img src="${url}" alt="Preview" style="max-width: 200px; border-radius: 10px;">`;
                    
                    // Stop camera after capture
                    stream.getTracks().forEach(track => track.stop());
                    video.style.display = 'none';
                }, 'image/jpeg');
            });
        }
    } catch (error) {
        console.error('Error accessing camera:', error);
        alert('Tidak dapat mengakses kamera: ' + error.message);
    }
}

// Initialize user pages
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname.split('/').pop();
    
    if (currentPage === 'user-dashboard.html') {
        loadUserDashboardData();
    } else if (currentPage === 'user-attendance.html') {
        initGeolocation();
        initCamera();
    } else if (currentPage === 'user-profile.html') {
        loadUserProfile();
    }
});
