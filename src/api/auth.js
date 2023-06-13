import defaultUser from '../utils/default-user';

export async function signIn(name, code) {
  try {
    // Send request
    console.log(name, code);

    return {
      isOk: true,
      data: { name: name, code:code}
    };
  }
  catch {
    return {
      isOk: false,
      message: "Authentication failed"
    };
  }
}

export async function getUser() {
  try {
    // Send request

    return {
      isOk: true
      // data: defaultUser
    };
  }
  catch {
    return {
      isOk: false
    };
  }
}

export async function createAccount(name, code) {
  try {
    // Send request
    console.log(name, code);

    return {
      isOk: true
    };
  }
  catch {
    return {
      isOk: false,
      message: "Failed to create account"
    };
  }
}

export async function changePassword(name, recoveryCode) {
  try {
    // Send request
    console.log(name, recoveryCode);

    return {
      isOk: true
    };
  }
  catch {
    return {
      isOk: false,
      message: "Failed to change password"
    }
  }
}

export async function resetPassword(name) {
  try {
    // Send request
    console.log(name);

    return {
      isOk: true
    };
  }
  catch {
    return {
      isOk: false,
      message: "Failed to reset password"
    };
  }
}
