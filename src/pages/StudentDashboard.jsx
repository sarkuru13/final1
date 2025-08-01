import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentUser, logout } from '../services/studentAuthService';
import { getStudentByUserId } from '../services/studentService';
import { setStudentPermissions } from '../services/permissionService';
import toast, { Toaster } from 'react-hot-toast';

function StudentDashboard() {
    const [user, setUser] = useState(null); // Stores the authentication user object
    const [studentData, setStudentData] = useState(null); // Stores the student document from the database
    const [loading, setLoading] = useState(true);
    const [isActivating, setIsActivating] = useState(false); // For button loading state
    const [permissionsActivated, setPermissionsActivated] = useState(false); // To track permission status
    const navigate = useNavigate();

    useEffect(() => {
        const checkAuthAndFetchData = async () => {
            try {
                const currentUser = await getCurrentUser();
                if (currentUser && (currentUser.prefs?.role === 'student' || currentUser.labels?.includes('student'))) {
                    setUser(currentUser);
                    // After confirming auth, fetch the student's database record
                    const studentDoc = await getStudentByUserId(currentUser.$id);
                    setStudentData(studentDoc);

                    // Check if permissions are already activated by inspecting the document's permissions
                    if (studentDoc && studentDoc.$permissions.includes(`read("user:${currentUser.$id}")`)) {
                        setPermissionsActivated(true);
                    }
                } else {
                    navigate('/student-login');
                }
            } catch (error) {
                console.error('Error checking auth or fetching student data:', error.message);
                navigate('/student-login');
            } finally {
                setLoading(false);
            }
        };
        checkAuthAndFetchData();
    }, [navigate]);

    const handleLogout = async () => {
        await logout();
        navigate('/student-login');
    };

    /**
     * Handles the click event for the "Activate My Permissions" button.
     * It calls the Appwrite service to set read/update permissions for the current user
     * on their own student document.
     */
    const handleActivatePermissions = async () => {
        if (!studentData || !studentData.$id || !studentData.userId) {
            toast.error('Student data is not available yet. Please wait a moment and try again.');
            return;
        }

        setIsActivating(true);
        const toastId = toast.loading('Activating permissions...');

        try {
            // Call the service to update permissions
            await setStudentPermissions(studentData.$id, studentData.userId);
            toast.success('Permissions activated successfully!', { id: toastId });
            setPermissionsActivated(true); // Update state to reflect activation
        } catch (error) {
            console.error('Failed to activate permissions:', error);
            toast.error(`Failed to activate permissions: ${error.message}`, { id: toastId });
        } finally {
            setIsActivating(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <>
            {/* Toaster for displaying notifications */}
            <Toaster position="top-right" toastOptions={{ className: 'dark:bg-gray-700 dark:text-white' }} />
            <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
                <header className="bg-white dark:bg-gray-800 shadow-md">
                    <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex items-center justify-between h-16">
                            <div className="flex items-center">
                                <img src="/nielit.png" alt="Logo" className="w-10 h-10" />
                                <h1 className="text-xl font-bold ml-2">Student Dashboard</h1>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="px-4 py-2 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30"
                            >
                                Logout
                            </button>
                        </div>
                    </nav>
                </header>

                <main className="max-w-4xl mx-auto mt-8 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6">
                        <h2 className="text-2xl font-bold mb-4">Welcome, {user?.name}!</h2>
                        <div className="space-y-2 text-sm">
                            <p>
                                <span className="font-semibold">Name:</span> {user?.name}
                            </p>
                            <p>
                                <span className="font-semibold">Email:</span> {user?.email}
                            </p>
                            <p>
                                <span className="font-semibold">User ID (from DB):</span>
                                <span className="font-mono text-gray-500 dark:text-gray-400 ml-2">
                                    {studentData ? studentData.userId : 'Loading...'}
                                </span>
                            </p>
                            <p>
                                <span className="font-semibold">Document ID:</span>
                                <span className="font-mono text-gray-500 dark:text-gray-400 ml-2">
                                    {studentData ? studentData.$id : 'Loading...'}
                                </span>
                            </p>
                        </div>

                        {/* Section for activating permissions */}
                        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                            {permissionsActivated ? (
                                <div className="bg-green-100 dark:bg-green-900/30 border-l-4 border-green-500 text-green-800 dark:text-green-300 p-4 rounded-lg" role="alert">
                                    <p className="font-bold">Permissions Activated</p>
                                    <p className="text-sm">You can now log in to your phone.</p>
                                </div>
                            ) : (
                                <>
                                    <button
                                        onClick={handleActivatePermissions}
                                        disabled={isActivating || !studentData}
                                        className="w-full sm:w-auto flex items-center justify-center px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {isActivating ? 'Activating...' : 'Activate My Permissions'}
                                    </button>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        Click this button to grant yourself read and write access to your student record. This is usually a one-time action.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
}

export default StudentDashboard;