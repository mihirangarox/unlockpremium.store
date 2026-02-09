import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../src/firebase'; // Corrected import path

const AdminLoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(''); // Clear previous messages

        try {
            // 1. Sign in with Firebase Authentication on the client-side
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            // 2. Get the Firebase ID token from the user.
            const idToken = await user.getIdToken();

            // 3. (Optional but recommended) Send the token to your backend to verify and create a session.
            // This step confirms that the token is valid and allows your backend to know the user is authenticated.
            const response = await fetch('http://localhost:3001/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // Include the token in the Authorization header
                    'Authorization': `Bearer ${idToken}`,
                },
                 body: JSON.stringify({ idToken }), // Send token in the body as well as per server setup
            });

            const data = await response.json();

            if (response.ok) {
                setMessage('Login successful! Redirecting...');
                // Here you would typically redirect to a protected admin dashboard
                // For example: window.location.href = '/admin/dashboard';
            } else {
                throw new Error(data.message || 'Backend verification failed.');
            }

        } catch (error: any) {
            console.error("Login Error:", error);
            // Provide more user-friendly error messages
            let errorMessage = 'An error occurred. Please try again.';
            if (error.code) { // Firebase specific errors
                switch (error.code) {
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                    case 'auth/invalid-credential':
                        errorMessage = 'Invalid email or password.';
                        break;
                    default:
                        errorMessage = error.message;
                        break;
                }
            } else if (error.message) {
                errorMessage = error.message; // Backend or other errors
            }
            setMessage(errorMessage);
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
            <div className="bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md">
                <h2 className="text-2xl font-bold mb-6 text-center">Admin Login</h2>
                <form onSubmit={handleLogin}>
                    <div className="mb-4">
                        <label className="block text-gray-400 mb-2">Email</label>
                        <input
                            type="email" // Use type="email" for better validation
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <div className="mb-6">
                        <label className="block text-gray-400 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-md transition duration-300"
                    >
                        Login
                    </button>
                </form>
                {message && <p className="mt-4 text-center text-red-400">{message}</p>}
            </div>
        </div>
    );
};

export default AdminLoginPage;
