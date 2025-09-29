# Frontend Integration Guide - Users Module

## 🚀 Quick Start

The Users API is now fully implemented and ready for frontend integration. Here's everything you need to know:

## 📋 Available Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/users` | Create new user | Admin only |
| GET | `/api/users` | Get all users (paginated) | Admin only |
| GET | `/api/users/:id` | Get user by ID | Admin only |
| PATCH | `/api/users/:id` | Update user | Admin only |
| DELETE | `/api/users/:id` | Delete user | Admin only |

## 🔧 API Documentation

- **Swagger UI**: http://localhost:3000/docs
- **JSON Schema**: http://localhost:3000/docs/json
- **Detailed Docs**: See `docs/USERS_API_DOCUMENTATION.md`

## 🛠 Frontend Implementation Examples

### 1. User Management Service

```typescript
// services/userService.ts
class UserService {
  private baseUrl = 'http://localhost:3000/api/users';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Create user
  async createUser(userData: CreateUserRequest) {
    return this.request('', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Get all users with pagination
  async getUsers(params: UserQueryParams = {}) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.append(key, value.toString());
      }
    });
    
    return this.request(`?${searchParams.toString()}`);
  }

  // Get user by ID
  async getUserById(id: number) {
    return this.request(`/${id}`);
  }

  // Update user
  async updateUser(id: number, userData: UpdateUserRequest) {
    return this.request(`/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  // Delete user
  async deleteUser(id: number) {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.token}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return true;
  }
}
```

### 2. React Hook for User Management

```typescript
// hooks/useUsers.ts
import { useState, useEffect, useCallback } from 'react';
import { UserService } from '../services/userService';

interface UseUsersReturn {
  users: User[];
  loading: boolean;
  error: string | null;
  total: number;
  page: number;
  limit: number;
  fetchUsers: (params?: UserQueryParams) => Promise<void>;
  createUser: (userData: CreateUserRequest) => Promise<void>;
  updateUser: (id: number, userData: UpdateUserRequest) => Promise<void>;
  deleteUser: (id: number) => Promise<void>;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

export const useUsers = (token: string): UseUsersReturn => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const userService = new UserService(token);

  const fetchUsers = useCallback(async (params: UserQueryParams = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await userService.getUsers({
        page,
        limit,
        ...params,
      });
      
      setUsers(response.data.data);
      setTotal(response.data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [page, limit, userService]);

  const createUser = async (userData: CreateUserRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      await userService.createUser(userData);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (id: number, userData: UpdateUserRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      await userService.updateUser(id, userData);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      await userService.deleteUser(id);
      await fetchUsers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    total,
    page,
    limit,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    setPage,
    setLimit,
  };
};
```

### 3. React Component Example

```tsx
// components/UserManagement.tsx
import React, { useState } from 'react';
import { useUsers } from '../hooks/useUsers';

interface UserManagementProps {
  token: string;
}

export const UserManagement: React.FC<UserManagementProps> = ({ token }) => {
  const {
    users,
    loading,
    error,
    total,
    page,
    limit,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    setPage,
    setLimit,
  } = useUsers(token);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const handleCreateUser = async (userData: CreateUserRequest) => {
    await createUser(userData);
    setShowCreateForm(false);
  };

  const handleUpdateUser = async (id: number, userData: UpdateUserRequest) => {
    await updateUser(id, userData);
    setEditingUser(null);
  };

  const handleDeleteUser = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      await deleteUser(id);
    }
  };

  if (loading && users.length === 0) {
    return <div>Loading...</div>;
  }

  return (
    <div className="user-management">
      <div className="header">
        <h2>User Management</h2>
        <button onClick={() => setShowCreateForm(true)}>
          Create New User
        </button>
      </div>

      {error && (
        <div className="error">
          Error: {error}
        </div>
      )}

      <div className="filters">
        <input
          type="text"
          placeholder="Search by email..."
          onChange={(e) => fetchUsers({ email: e.target.value })}
        />
        <select onChange={(e) => fetchUsers({ role: e.target.value })}>
          <option value="">All Roles</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
      </div>

      <div className="user-list">
        {users.map((user) => (
          <div key={user.id} className="user-card">
            <div className="user-info">
              <h3>{user.email}</h3>
              <p>Role: {user.role}</p>
              <p>Profile: {user.profile || 'No profile'}</p>
              <p>Created: {new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
            <div className="user-actions">
              <button onClick={() => setEditingUser(user)}>
                Edit
              </button>
              <button onClick={() => handleDeleteUser(user.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="pagination">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Previous
        </button>
        <span>Page {page} of {Math.ceil(total / limit)}</span>
        <button
          disabled={page >= Math.ceil(total / limit)}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>

      {showCreateForm && (
        <UserForm
          onSubmit={handleCreateUser}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {editingUser && (
        <UserForm
          user={editingUser}
          onSubmit={(userData) => handleUpdateUser(editingUser.id, userData)}
          onCancel={() => setEditingUser(null)}
        />
      )}
    </div>
  );
};
```

## 📊 TypeScript Types

```typescript
// types/user.ts
export interface User {
  id: number;
  email: string;
  role: 'admin' | 'user';
  profile?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  role: 'admin' | 'user';
  profile?: string;
}

export interface UpdateUserRequest {
  email?: string;
  password?: string;
  role?: 'admin' | 'user';
  profile?: string;
}

export interface UserQueryParams {
  email?: string;
  role?: 'admin' | 'user';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
```

## 🔐 Authentication

All API calls require a valid JWT token. Include it in the Authorization header:

```typescript
headers: {
  'Authorization': `Bearer ${yourJwtToken}`,
  'Content-Type': 'application/json',
}
```

## 🚨 Error Handling

The API returns standardized error responses:

```typescript
// Success response
{
  "data": { /* response data */ },
  "message": "Success",
  "success": true
}

// Error response
{
  "data": null,
  "message": "Error message",
  "success": false
}
```

## 📝 Testing

You can test the API using the Swagger UI at http://localhost:3000/docs or with cURL:

```bash
# Get all users
curl -X GET "http://localhost:3000/api/users" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Create a user
curl -X POST "http://localhost:3000/api/users" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "role": "user",
    "profile": "Test User"
  }'
```

## 🎯 Next Steps

1. **Test the API** using Swagger UI
2. **Implement the frontend service** using the provided examples
3. **Create user management components** for your admin panel
4. **Add proper error handling** and loading states
5. **Implement pagination** for large user lists

## 📞 Support

If you encounter any issues:
1. Check the Swagger documentation at http://localhost:3000/docs
2. Review the detailed API documentation in `docs/USERS_API_DOCUMENTATION.md`
3. Check the server logs for error details

The Users API is now fully functional and ready for frontend integration! 🎉
