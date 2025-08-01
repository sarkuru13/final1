import { Client, Databases, Query, Permission, Role } from 'appwrite';

// --- No changes to client and database initialization ---
const client = new Client();
try {
  const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
  const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;
  if (!endpoint || !projectId) {
    throw new Error('Missing VITE_APPWRITE_ENDPOINT or VITE_APPWRITE_PROJECT_ID');
  }
  client.setEndpoint(endpoint).setProject(projectId);
} catch (error) {
  console.error('❌ Failed to initialize Appwrite client:', error.message);
  throw error;
}

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || '';
const STUDENT_COLLECTION_ID = import.meta.env.VITE_APPWRITE_STUDENT_COLLECTION_ID || '';

export async function listStudentUserIds() {
  try {
    if (!DATABASE_ID || !STUDENT_COLLECTION_ID) {
      throw new Error('Missing DATABASE_ID or STUDENT_COLLECTION_ID environment variables');
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      STUDENT_COLLECTION_ID,
      [Query.orderDesc('$createdAt')]
    );

    if (response.total === 0) {
      console.log('⚠️ No student documents found in the collection.');
      return [];
    }

    const students = response.documents.map((doc) => {
      const userId = doc.userId || 'No userId found';
      console.log(`✅ Student Document ID: ${doc.$id}, User ID: ${userId}`);
      return { documentId: doc.$id, userId: userId };
    });

    return students;
  } catch (error) {
    console.error('❌ Failed to fetch student documents:', error.message);
    throw new Error('Failed to fetch student documents: ' + error.message);
  }
}

export async function setStudentPermissions(documentId, userId) {
  try {
    // --- NEW, MORE SPECIFIC DEBUGGING ---
    // Log the received userId and its type immediately to diagnose the issue.
    console.log(`[DEBUG] setStudentPermissions called for doc: ${documentId} with userId: "${userId}" (type: ${typeof userId})`);

    // Stricter validation to ensure userId is a non-empty string before proceeding.
    // This is the most likely point of failure.
    if (!documentId || typeof userId !== 'string' || !userId || userId === 'No userId found') {
      throw new Error(`Invalid or missing userId for document ${documentId}. Received: "${userId}". Aborting permission set.`);
    }

    if (!DATABASE_ID || !STUDENT_COLLECTION_ID) {
      throw new Error('Missing DATABASE_ID or STUDENT_COLLECTION_ID environment variables');
    }

    // --- FIX APPLIED HERE ---
    // The error "Role 'users' dimension value is invalid" occurs because Role.users()
    // does not accept a specific user ID. It's for general groups like 'verified'.
    // The correct method for a specific user is Role.user(userId).
    const permissions = [
      Permission.read(Role.user(userId)),      // Corrected from Role.users()
      Permission.update(Role.user(userId))     // Corrected from Role.users()
    ];

    console.log(`[DEBUG] Attempting to set permissions for doc ${documentId}:`, permissions);

    // Update document permissions
    await databases.updateDocument(
      DATABASE_ID,
      STUDENT_COLLECTION_ID,
      documentId,
      {}, // No data changes, only permissions
      permissions
    );

    console.log(`✅ Permissions set for document ${documentId} with userId ${userId}`);
  } catch (error) {
    console.error('❌ Failed to set permissions for document. Please review the DEBUGGING CHECKLIST and console logs.', error);
    throw error;
  }
}