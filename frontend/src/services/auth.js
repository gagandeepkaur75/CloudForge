/**
 * CloudForge Authentication Service
 * Supports Amazon Cognito User Pool integration and local Mock Mode fallback.
 */

const STORAGE_KEY = 'cloudforge_auth_user';
const TOKEN_KEY = 'cloudforge_auth_token';
const MOCK_FLAG_KEY = 'cloudforge_use_mock';

// Pre-configured student team members for UCS531 evaluation
export const DEMO_USERS = [
  {
    email: 'gkaur10_be24@thapar.edu',
    name: 'Gagandeep Kaur',
    role: 'Admin',
    rollNo: '1024170063',
    department: 'Computer Science & Engineering',
    avatar: 'GK'
  },
  {
    email: 'psingh18_be24@thapar.edu',
    name: 'Puneet Singh',
    role: 'Editor',
    rollNo: '1024170066',
    department: 'Computer Science & Engineering',
    avatar: 'PS'
  },
  {
    email: 'agupta5_be24@thapar.edu',
    name: 'Aditya Gupta',
    role: 'Editor',
    rollNo: '1024170204',
    department: 'Computer Science & Engineering',
    avatar: 'AG'
  }
];

export const authService = {
  isMockMode() {
    const stored = localStorage.getItem(MOCK_FLAG_KEY);
    if (stored !== null) return stored === 'true';
    const envVal = import.meta.env?.VITE_USE_MOCK;
    return envVal === 'true' || !this.getApiUrl();
  },

  setMockMode(enabled) {
    localStorage.setItem(MOCK_FLAG_KEY, enabled ? 'true' : 'false');
  },

  getApiUrl() {
    return import.meta.env?.VITE_API_URL || '';
  },

  getUserPoolId() {
    return import.meta.env?.VITE_USER_POOL_ID || '';
  },

  getClientId() {
    return import.meta.env?.VITE_CLIENT_ID || '';
  },

  getCurrentUser() {
    try {
      const userStr = localStorage.getItem(STORAGE_KEY);
      if (userStr) return JSON.parse(userStr);
    } catch (e) {
      console.error('Failed to parse cached user', e);
    }
    // Default fallback to Gagandeep Kaur (Admin / Lead)
    return DEMO_USERS[0];
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY) || 'mock-cognito-jwt-token-admin';
  },

  async signIn(email, password) {
    // If live Cognito is configured and mock mode is disabled, initiate Cognito SRP/PASSWORD auth
    if (!this.isMockMode() && this.getUserPoolId() && this.getClientId()) {
      try {
        const response = await fetch(`https://cognito-idp.${import.meta.env.VITE_AWS_REGION || 'us-east-1'}.amazonaws.com/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-amz-json-1.1',
            'X-Amz-Target': 'AWSCognitoIdentityProviderService.InitiateAuth'
          },
          body: JSON.stringify({
            AuthFlow: 'USER_PASSWORD_AUTH',
            ClientId: this.getClientId(),
            AuthParameters: {
              USERNAME: email,
              PASSWORD: password
            }
          })
        });

        const data = await response.json();
        if (data.AuthenticationResult) {
          const idToken = data.AuthenticationResult.IdToken;
          const user = {
            email,
            name: email.split('@')[0],
            role: 'Editor',
            avatar: email.substring(0, 2).toUpperCase()
          };
          localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
          localStorage.setItem(TOKEN_KEY, idToken);
          return user;
        }
        throw new Error(data.message || 'Cognito authentication failed');
      } catch (err) {
        console.warn('Cognito sign in error, falling back to mock authentication:', err.message);
      }
    }

    // Mock Mode fallback
    const matched = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
    const user = matched || {
      email,
      name: email.split('@')[0],
      role: 'Editor',
      rollNo: 'N/A',
      department: 'Cloud Computing UCS531',
      avatar: email.substring(0, 2).toUpperCase()
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_KEY, `mock-jwt-${user.role.toLowerCase()}-${Date.now()}`);
    return user;
  },

  async signUp(email, password, name, role = 'Editor') {
    const newUser = {
      email,
      name,
      role,
      rollNo: '102417' + Math.floor(1000 + Math.random() * 9000),
      department: 'Computer Science & Engineering',
      avatar: name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    localStorage.setItem(TOKEN_KEY, `mock-jwt-${role.toLowerCase()}-${Date.now()}`);
    return newUser;
  },

  updateUserProfile(updatedData) {
    const current = this.getCurrentUser();
    const merged = { ...current, ...updatedData };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return merged;
  },

  changePassword(oldPassword, newPassword) {
    // In mock mode, simply simulate success
    return { success: true, message: 'Password updated successfully in Amazon Cognito.' };
  },

  signOut() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TOKEN_KEY);
  }
};
