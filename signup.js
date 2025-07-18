// signup.js

import { db, auth, RecaptchaVerifier } from './firebase-config.js';
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { signInWithPhoneNumber, setPersistence, browserLocalPersistence } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { isValidVietnamesePhone, convertToE164, clearForm } from './utils.js';

let recaptchaVerifierInstance = null;

// Show signup form and initialize reCAPTCHA
document.getElementById('signup-link').addEventListener('click', () => {
    document.getElementById('signup-container').style.display = 'block';
    document.getElementById('login-container').style.display = 'none';

    if (!recaptchaVerifierInstance) {
        recaptchaVerifierInstance = new RecaptchaVerifier(auth, 'recaptcha-container', {
            'size': 'normal',
            'callback': () => console.log("✅ reCAPTCHA solved."),
            'expired-callback': () => console.log("⚠️ reCAPTCHA expired, please retry.")
        });
        recaptchaVerifierInstance.render().then(() => {
            console.log("✅ reCAPTCHA rendered.");
        });
    }
});

// Send OTP for signup
document.getElementById('send-otp-btn').addEventListener('click', async (e) => {
    e.preventDefault();
    const rawPhone = document.getElementById('signup-phone').value.trim();

    if (!isValidVietnamesePhone(rawPhone)) {
        alert("❌ Invalid Vietnamese phone format.");
        return;
    }

    const phoneNumber = convertToE164(rawPhone);
    console.log("📞 Converted phone to E.164:", phoneNumber);

    try {
        if (await checkIfPhoneExists(phoneNumber)) {
            alert("❌ Phone already registered, please log in.");
            return;
        }

        const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifierInstance);
        window.confirmationResult = confirmationResult;
        document.getElementById('otp-section').style.display = 'block';
        alert("✅ OTP sent. Please enter it to verify.");
    } catch (error) {
        console.error("❌ Error sending OTP:", error);
        alert("❌ Failed to send OTP: " + error.message);
    }
});

// Verify OTP and save user info
document.getElementById('verify-otp-btn').addEventListener('click', async () => {
    const otp = document.getElementById('otp-code').value.trim();
    const name = document.getElementById('signup-name').value.trim();
    const rawPhone = document.getElementById('signup-phone').value.trim();
    const phoneNumber = convertToE164(rawPhone);

    if (!window.confirmationResult) {
        alert("⚠️ Please send OTP before verifying.");
        return;
    }

    try {
        console.log("📲 Confirming OTP...");
        const result = await window.confirmationResult.confirm(otp);
        const user = result.user;
        console.log("✅ OTP verified, UID:", user.uid);

        console.log("📝 Writing user info to Firestore:", { uid: user.uid, name, phoneNumber });
        await setDoc(doc(db, "users", user.uid), {
            name: name,
            phone: phoneNumber,
            createdAt: serverTimestamp()
        });
        console.log("✅ User info saved to Firestore.");

        // Fetch to confirm write and update UI
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("📦 Fetched user data from Firestore:", userData);
            document.getElementById('user-name').textContent = userData.name || "User";
            document.getElementById('logout-link').style.display = 'inline';
        } else {
            console.warn("⚠️ User document not found after write.");
            document.getElementById('user-name').textContent = "User";
        }

        alert("✅ Signup successful!");
        document.getElementById('signup-container').style.display = 'none';
        clearForm('signup-container', 'otp-section', recaptchaVerifierInstance);

    } catch (error) {
        console.error("❌ OTP verification or Firestore write error:", error);
        alert("❌ Signup failed: " + error.message);
    }
});

// Cancel signup buttons
document.getElementById('cancel-signup-btn').addEventListener('click', () => {
    document.getElementById('signup-container').style.display = 'none';
    clearForm('signup-container', 'otp-section', recaptchaVerifierInstance);
});

document.getElementById('cancel-otp-btn').addEventListener('click', () => {
    document.getElementById('signup-container').style.display = 'none';
    clearForm('signup-container', 'otp-section', recaptchaVerifierInstance);
});

// Utility: Check if phone exists in Firestore
async function checkIfPhoneExists(phoneNumber) {
    const q = query(collection(db, "users"), where("phone", "==", phoneNumber));
    const snap = await getDocs(q);
    console.log(`🔍 Checking if phone ${phoneNumber} exists: ${!snap.empty}`);
    return !snap.empty;
}

// Real-time validation for phone input
document.getElementById('signup-phone').addEventListener('input', (e) => {
    const valid = isValidVietnamesePhone(e.target.value.trim());
    e.target.setCustomValidity(valid ? "" : "❌ Invalid VN phone. Format: 09xxxxxxxx.");
});

// Ensure Firebase Auth persistence
setPersistence(auth, browserLocalPersistence)
    .then(() => console.log("✅ Auth persistence enabled for signup."))
    .catch((error) => console.error("❌ Auth persistence error:", error));
