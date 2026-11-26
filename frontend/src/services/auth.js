/**
 * CloudForge authentication through an Amazon Cognito User Pool.
 */

const STORAGE_KEY = 'cloudforge_auth_user';
const ID_TOKEN_KEY = 'cloudforge_id_token';
const ACCESS_TOKEN_KEY = 'cloudforge_access_token';
const REFRESH_TOKEN_KEY = 'cloudforge_refresh_token';
let tokenRefreshPromise = null;

function getCognitoConfig() {
  const userPoolId = import.meta.env?.VITE_USER_POOL_ID;
  const clientId = import.meta.env?.VITE_CLIENT_ID;
  const region = import.meta.env?.VITE_AWS_REGION || userPoolId?.split('_')[0];

  if (!userPoolId || !clientId || !region) {
    throw new Error('Authentication is not configured. Set the Cognito User Pool ID, app client ID, and AWS region.');
  }

  return { clientId, region };
}

async function cognitoRequest(target, body) {
  const { clientId, region } = getCognitoConfig();
  const requestBody = body.AccessToken ? body : { ClientId: clientId, ...body };
  const response = await fetch(`https://cognito-idp.${region}.amazonaws.com/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': `AWSCognitoIdentityProviderService.${target}`
    },
    body: JSON.stringify(requestBody)
  });

  const data = await response.json();
  if (!response.ok) {
    const errorName = data.__type?.split('#').pop();
    const messages = {
      NotAuthorizedException: 'The email or password is incorrect.',
      UserNotFoundException: 'No account was found for this email address.',
      UserNotConfirmedException: 'Confirm your email address before signing in.',
      UsernameExistsException: 'An account with this email already exists.',
      CodeMismatchException: 'The verification code is incorrect.',
      ExpiredCodeException: 'The verification code has expired. Request a new one.',
      LimitExceededException: 'Too many attempts. Please wait and try again.',
      InvalidPasswordException: 'The password does not meet the account password requirements.'
    };
    throw new Error(messages[errorName] || data.message || 'Cognito request failed. Please try again.');
  }

  return data;
}

function clearStoredSession() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(ID_TOKEN_KEY);
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

function decodeTokenPayload(token) {
  try {
    const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

function createUserFromIdToken(idToken) {
  const claims = decodeTokenPayload(idToken);
  if (!claims || typeof claims.exp !== 'number' || claims.exp <= Date.now() / 1000) {
    throw new Error('Cognito returned an invalid or expired identity token.');
  }

  return {
    email: claims.email || claims.username || '',
    name: claims.name || claims.email || 'CloudForge user',
    role: 'Member',
    avatar: (claims.name || claims.email || 'U').split(/\s|@/).filter(Boolean).map(part => part[0]).join('').slice(0, 2).toUpperCase(),
    cognitoSub: claims.sub
  };
}

function saveSession(authenticationResult) {
  const { IdToken, AccessToken, RefreshToken } = authenticationResult || {};
  if (!IdToken || !AccessToken) {
    throw new Error('Cognito did not return a complete authenticated session.');
  }
  const user = createUserFromIdToken(IdToken);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(ID_TOKEN_KEY, IdToken);
  localStorage.setItem(ACCESS_TOKEN_KEY, AccessToken);
  if (RefreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, RefreshToken);
  return user;
}

export const authService = {
  clearLocalSession() {
    clearStoredSession();
  },

  getCurrentUser() {
    const idToken = localStorage.getItem(ID_TOKEN_KEY);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedUser = localStorage.getItem(STORAGE_KEY);
    const claims = idToken ? decodeTokenPayload(idToken) : null;

    if (!claims || !accessToken || !storedUser) {
      clearStoredSession();
      return null;
    }
    if (claims.exp <= Date.now() / 1000) {
      if (!localStorage.getItem(REFRESH_TOKEN_KEY)) clearStoredSession();
      return null;
    }

    try {
      return { ...JSON.parse(storedUser), ...createUserFromIdToken(idToken) };
    } catch (error) {
      console.error('Unable to restore the Cognito session:', error);
      clearStoredSession();
      return null;
    }
  },

  getToken() {
    const idToken = localStorage.getItem(ID_TOKEN_KEY);
    const claims = idToken ? decodeTokenPayload(idToken) : null;
    if (!claims || typeof claims.exp !== 'number' || claims.exp <= Date.now() / 1000) {
      if (!localStorage.getItem(REFRESH_TOKEN_KEY)) clearStoredSession();
      return null;
    }
    return idToken;
  },

  async getValidToken() {
    const idToken = localStorage.getItem(ID_TOKEN_KEY);
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const claims = idToken ? decodeTokenPayload(idToken) : null;
    const hasSession = claims && accessToken && localStorage.getItem(STORAGE_KEY);
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

    if (!hasSession || typeof claims.exp !== 'number') {
      clearStoredSession();
      return null;
    }

    if (claims.exp > Date.now() / 1000 + 60) return idToken;
    if (!refreshToken) {
      clearStoredSession();
      return null;
    }

    if (!tokenRefreshPromise) {
      tokenRefreshPromise = (async () => {
        try {
          const response = await cognitoRequest('InitiateAuth', {
            AuthFlow: 'REFRESH_TOKEN_AUTH',
            AuthParameters: { REFRESH_TOKEN: refreshToken }
          });
          if (!response.AuthenticationResult) {
            throw new Error('Cognito did not refresh the authenticated session.');
          }
          saveSession({ ...response.AuthenticationResult, RefreshToken: refreshToken });
          return localStorage.getItem(ID_TOKEN_KEY);
        } catch (error) {
          clearStoredSession();
          throw error;
        }
      })();
    }

    try {
      return await tokenRefreshPromise;
    } finally {
      tokenRefreshPromise = null;
    }
  },

  async restoreSession() {
    const token = await this.getValidToken();
    return token ? this.getCurrentUser() : null;
  },

  async signIn(email, password) {
    const response = await cognitoRequest('InitiateAuth', {
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: { USERNAME: email.trim(), PASSWORD: password }
    });

    if (response.AuthenticationResult) return saveSession(response.AuthenticationResult);
    if (response.ChallengeName) {
      throw new Error(`Cognito requires an additional sign-in step (${response.ChallengeName}), which is not configured yet.`);
    }
    throw new Error('Cognito did not complete sign-in.');
  },

  async signUp(email, password, name) {
    await cognitoRequest('SignUp', {
      Username: email.trim(),
      Password: password,
      UserAttributes: [
        { Name: 'email', Value: email.trim() },
        { Name: 'name', Value: name.trim() }
      ]
    });
    return { confirmationRequired: true };
  },

  async confirmSignUp(email, confirmationCode) {
    await cognitoRequest('ConfirmSignUp', {
      Username: email.trim(),
      ConfirmationCode: confirmationCode.trim()
    });
  },

  async resendSignUpCode(email) {
    await cognitoRequest('ResendConfirmationCode', { Username: email.trim() });
  },

  async forgotPassword(email) {
    await cognitoRequest('ForgotPassword', { Username: email.trim() });
  },

  async confirmForgotPassword(email, confirmationCode, newPassword) {
    await cognitoRequest('ConfirmForgotPassword', {
      Username: email.trim(),
      ConfirmationCode: confirmationCode.trim(),
      Password: newPassword
    });
  },

  async updateUserProfile(updatedData) {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) throw new Error('Your session has expired. Please sign in again.');

    const attributes = [];
    if (updatedData.name) attributes.push({ Name: 'name', Value: updatedData.name.trim() });
    const currentUser = this.getCurrentUser();
    if (updatedData.email && updatedData.email.trim() !== currentUser?.email) {
      throw new Error('Email changes require a Cognito verification flow, which is not configured yet.');
    }
    if (attributes.length === 0) return this.getCurrentUser();

    await cognitoRequest('UpdateUserAttributes', { AccessToken: accessToken, UserAttributes: attributes });
    const user = { ...currentUser, name: updatedData.name.trim() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    return user;
  },

  async changePassword(oldPassword, newPassword) {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (!accessToken) throw new Error('Your session has expired. Please sign in again.');
    await cognitoRequest('ChangePassword', {
      AccessToken: accessToken,
      PreviousPassword: oldPassword,
      ProposedPassword: newPassword
    });
    return { success: true, message: 'Your Cognito password was updated.' };
  },

  async signOut() {
    const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    clearStoredSession();
    if (accessToken) {
      await cognitoRequest('GlobalSignOut', { AccessToken: accessToken });
    }
  }
};
