// login.js

import { db, auth, RecaptchaVerifier } from './firebase-config.js';
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signInWithPhoneNumber, setPersistence, browserLocalPersistence, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { isValidVietnamesePhone, convertToE164, clearForm } from './utils.js';

let loginRecaptchaVerifier = null;

// Show login form and initialize reCAPTCHA
document.getElementById('login-link').addEventListener('click', () => {
    document.getElementById('login-container').style.display = 'block';
    document.getElementById('signup-container').style.display = 'none';

    if (!loginRecaptchaVerifier) {
        loginRecaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-login-container', {
            'size': 'normal',
            'callback': () => console.log("✅ Login reCAPTCHA solved."),
            'expired-callback': () => console.log("⚠️ Login reCAPTCHA expired, please retry.")
        });
        loginRecaptchaVerifier.render().then(() => {
            console.log("✅ Login reCAPTCHA rendered.");
        });
    }
});

// Send OTP for login
document.getElementById('login-send-otp-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    const rawPhone = document.getElementById('login-phone').value.trim();

    if (!isValidVietnamesePhone(rawPhone)) {
        alert("❌ Invalid Vietnamese phone format.");
        return;
    }

    const phoneNumber = convertToE164(rawPhone);
    console.log("📞 Converted phone for login:", phoneNumber);

    try {
        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, loginRecaptchaVerifier);
        window.loginConfirmationResult = confirmationResult;
        document.getElementById('login-otp-section').style.display = 'block';
        alert("✅ OTP sent. Please enter it to log in.");
    } catch (error) {
        console.error("❌ Error sending OTP for login:", error);
        alert("❌ Failed to send OTP: " + error.message);
    }
});

// Verify OTP and sign in
document.getElementById('login-verify-otp-btn').addEventListener('click', async () => {
    const otp = document.getElementById('login-otp-code').value.trim();

    if (!window.loginConfirmationResult) {
        alert("⚠️ Please send OTP before verifying.");
        return;
    }

    try {
        console.log("📲 Confirming OTP for login...");
        const result = await window.loginConfirmationResult.confirm(otp);
        const user = result.user;
        console.log("✅ OTP verified, UID:", user.uid);

        // Fetch user info to display name
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("📦 User data fetched for login:", userData);
            document.getElementById('user-name').textContent = userData.name || "User";
        } else {
            console.warn("⚠️ User document not found, showing UID as fallback.");
            document.getElementById('user-name').textContent = user.uid.slice(0, 6);
        }

        document.getElementById('logout-link').style.display = 'inline';
        alert("✅ Login successful!");
        document.getElementById('login-container').style.display = 'none';

        clearForm('login-container', 'login-otp-section', loginRecaptchaVerifier);

    } catch (error) {
        console.error("❌ OTP verification failed:", error);
        alert("❌ Login failed: " + error.message);
    }
});

// Cancel login
document.getElementById('cancel-login-btn').addEventListener('click', () => {
    document.getElementById('login-container').style.display = 'none';
    clearForm('login-container', 'login-otp-section', loginRecaptchaVerifier);
});

// Set Auth persistence for login, define how the authentication state is persisted across sessions of browsers.
// this really no important for login, only need when exlicit control example log out when close tab browser.
setPersistence(auth, browserLocalPersistence)
    .then(() => console.log("✅ Auth persistence enabled for login."))
    .catch((error) => console.error("❌ Auth persistence error:", error));

// Check auth state on page load, listen for changes in authentication state in firebase
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("✅ User signed in, UID:", user.uid);
        try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                console.log("📦 User data loaded on page load:", userData);
                document.getElementById('user-name').textContent = userData.name || "User";
            } else {
                console.warn("⚠️ User document not found in Firestore on page load.");
                document.getElementById('user-name').textContent = user.uid.slice(0, 6);
            }
            document.getElementById('logout-link').style.display = 'inline';
        } catch (error) {
            console.error("❌ Error loading user data on page load:", error);
            document.getElementById('user-name').textContent = "User";
        }
    } else {
        console.log("ℹ️ No user signed in on page load, showing Guest.");
        document.getElementById('user-name').textContent = "Guest";
        document.getElementById('logout-link').style.display = 'none';
    }
});

// Handle logout
document.getElementById('logout-link').addEventListener('click', async (e) => {
    e.preventDefault();
    try {
        await signOut(auth);
        console.log("✅ User signed out.");
        document.getElementById('user-name').textContent = "Guest";
        document.getElementById('logout-link').style.display = 'none';
        alert("✅ You have been logged out.");
    } catch (error) {
        console.error("❌ Logout failed:", error);
        alert("❌ Logout failed: " + error.message);
    }
});