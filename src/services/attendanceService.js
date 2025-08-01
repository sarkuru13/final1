import { Client, Databases, Query, ID } from 'appwrite';
import { getStudent } from './studentService';

const client = new Client()
  .setEndpoint(import.meta.env.VITE_APPWRITE_ENDPOINT)
  .setProject(import.meta.env.VITE_APPWRITE_PROJECT_ID);

const databases = new Databases(client);

const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const ATTENDANCE_COLLECTION_ID = import.meta.env.VITE_APPWRITE_ATTENDANCE_COLLECTION_ID;

export async function getAttendance() {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      ATTENDANCE_COLLECTION_ID,
      [Query.orderDesc('$createdAt')]
    );
    return response.documents;
  } catch (error) {
    throw new Error('Failed to fetch attendance records: ' + error.message);
  }
}

export async function createAttendance(attendanceData) {
  try {
    // Validate Student_Id exists
    await getStudent(attendanceData.Student_Id); // Throws if student doesn't exist
    const response = await databases.createDocument(
      DATABASE_ID,
      ATTENDANCE_COLLECTION_ID,
      ID.unique(),
      {
        Student_Id: attendanceData.Student_Id,
        Status: attendanceData.Status,
        Course_Id: attendanceData.Course_Id,
        Marked_By: attendanceData.Marked_By,
        Marked_at: attendanceData.Marked_at,
        Latitude: attendanceData.Latitude,
        Longitude: attendanceData.Longitude
      }
    );
    return response;
  } catch (error) {
    throw new Error('Failed to create attendance: ' + error.message);
  }
}

export async function updateAttendance(attendanceId, attendanceData) {
  try {
    // **FIX:** Extract the student's ID string from the object before validation and updating.
    const studentId = typeof attendanceData.Student_Id === 'object' && attendanceData.Student_Id !== null
        ? attendanceData.Student_Id.$id
        : attendanceData.Student_Id;

    if (!studentId) {
        throw new Error('Invalid Student ID provided for update.');
    }

    // Validate Student_Id exists
    await getStudent(studentId);

    const response = await databases.updateDocument(
      DATABASE_ID,
      ATTENDANCE_COLLECTION_ID,
      attendanceId,
      {
        // Pass only the string ID for the relationship
        Student_Id: studentId,
        Status: attendanceData.Status,
        Course_Id: attendanceData.Course_Id,
        Marked_By: attendanceData.Marked_By,
        Marked_at: attendanceData.Marked_at,
        Latitude: attendanceData.Latitude,
        Longitude: attendanceData.Longitude
      }
    );
    return response;
  } catch (error) {
    // The original error from Appwrite is now more descriptive
    throw new Error('Failed to update attendance: ' + error.message);
  }
}

export async function deleteAttendance(attendanceId) {
  try {
    await databases.deleteDocument(DATABASE_ID, ATTENDANCE_COLLECTION_ID, attendanceId);
    return true;
  } catch (error) {
    throw new Error('Failed to delete attendance: ' + error.message);
  }
}
