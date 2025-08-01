import { account } from "./appwriteConfig";

export async function login(email, password) {
    try {
        // Attempt to delete any existing session first to ensure a clean login.
        try {
            await account.deleteSession('current');
        } catch (error) {
            // It's okay if there's no session to delete.
            console.log('No existing session to delete:', error.message);
        }
        // Create a new session with the provided email and password.
        await account.createEmailPasswordSession(email, password);
        // Get the currently logged-in user details.
        const currentUser = await account.get();
        console.log('Student login successful:', currentUser);

        // Verify that the user has the 'student' role.
        if (currentUser.prefs?.role !== 'student' && !currentUser.labels?.includes('student')) {
            // If not a student, log them out immediately and throw an error.
            await account.deleteSession('current');
            throw new Error('Access denied. Only students can log in here.');
        }
        return currentUser;
    } catch (error) {
        // Log any errors that occur during the login process.
        console.error('Student login failed:', error.message);
        throw error;
    }
}

export async function getCurrentUser() {
    try {
        // Attempt to get the current user details.
        const user = await account.get();
        return user;
    } catch (error) {
        // If there's an error (e.g., no active session), return null.
        return null;
    }
}

export async function logout() {
    try {
        // Delete the current session to log the user out.
        await account.deleteSession('current');
    } catch (error) {
        console.error("Logout failed", error.message);
    }
}