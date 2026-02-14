import { auth } from "@/lib/firebase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

/**
 * Get Firebase ID token from the current user
 */
async function getAuthToken(): Promise<string> {
  const user = auth.currentUser;``
  if (!user) {
    throw new Error("User not authenticated");
  }
  return await user.getIdToken();
}

/**
 * Generic fetch wrapper with authentication
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit & { noAuth?: boolean } = {}
): Promise<{ success: boolean; data?: T; error?: string; message?: string }> {
  try {
    const { noAuth = false, headers: customHeaders, ...restOptions } = options;

    let headers: HeadersInit = {
      "Content-Type": "application/json",
      ...customHeaders
    };

    // Add Firebase token if not opted out
    if (!noAuth) {
      try {
        const token = await getAuthToken();
        headers["Authorization"] = `Bearer ${token}`;
      } catch (error) {
        return {
          success: false,
          error: "UNAUTHORIZED",
          message: "Please log in first"
        };
      }
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...restOptions,
      headers
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || "API_ERROR",
        message: data.message || "An error occurred"
      };
    }

    return {
      success: true,
      data: data.user || data.issue || data.issues || data
    };
  } catch (error) {
    console.error(`API Error: ${endpoint}`, error);
    return {
      success: false,
      error: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Network error"
    };
  }
}

// ==================== Auth API ====================

export async function registerUser(userData: {
  name: string;
  email: string;
  role: "student" | "teacher";
  phone?: string;
  rollNo?: string;
  teacherId?: string;
  department?: string;
}) {
  return apiCall("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(userData)
  });
}

export async function verifyToken() {
  return apiCall("/api/auth/verify");
}

// ==================== User API ====================

export async function getProfile() {
  return apiCall("/api/users/me");
}

export async function updateProfile(data: {
  name?: string;
  phone?: string;
  department?: string;
}) {
  return apiCall("/api/users/me", {
    method: "PUT",
    body: JSON.stringify(data)
  });
}

export async function getUser(userId: string) {
  return apiCall(`/api/users/${userId}`);
}

// ==================== Issue API ====================

export async function createIssue(issueData: {
  title: string;
  category: string;
  location: string;
  description: string;
  priority?: "low" | "medium" | "high";
  imageBase64?: string;
}) {
  return apiCall("/api/issues", {
    method: "POST",
    body: JSON.stringify(issueData)
  });
}

export async function getMyIssues(filters?: {
  status?: "pending" | "in_progress" | "resolved";
  category?: string;
  limit?: number;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.category) params.append("category", filters.category);
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.page) params.append("page", filters.page.toString());

  const queryString = params.toString();
  const endpoint = `/api/issues/my${queryString ? `?${queryString}` : ""}`;

  return apiCall(endpoint);
}

export async function getIssue(issueId: string) {
  return apiCall(`/api/issues/${issueId}`);
}

export async function updateIssue(
  issueId: string,
  updateData: {
    status?: "pending" | "in_progress" | "resolved";
    priority?: "low" | "medium" | "high";
    resolution?: string;
    assignedTo?: string;
  }
) {
  return apiCall(`/api/issues/${issueId}`, {
    method: "PUT",
    body: JSON.stringify(updateData)
  });
}

export async function deleteIssue(issueId: string) {
  return apiCall(`/api/issues/${issueId}`, {
    method: "DELETE"
  });
}

export async function getAllIssues(filters?: {
  status?: "pending" | "in_progress" | "resolved";
  category?: string;
  limit?: number;
  page?: number;
}) {
  const params = new URLSearchParams();
  if (filters?.status) params.append("status", filters.status);
  if (filters?.category) params.append("category", filters.category);
  if (filters?.limit) params.append("limit", filters.limit.toString());
  if (filters?.page) params.append("page", filters.page.toString());

  const queryString = params.toString();
  const endpoint = `/api/issues${queryString ? `?${queryString}` : ""}`;

  return apiCall(endpoint);
}

export default {
  auth: { registerUser, verifyToken },
  user: { getProfile, updateProfile, getUser },
  issue: { createIssue, getMyIssues, getIssue, updateIssue, deleteIssue, getAllIssues }
};