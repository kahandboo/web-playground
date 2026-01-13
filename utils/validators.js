const ID_REGEX = /^[a-z0-9]{4,10}$/;
const USERNAME_REGEX = /^[a-zA-Z0-9가-힣]{2,10}$/;
const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*()_+=\-]).{8,32}$/;

async function isValidUsername(username) {
  return USERNAME_REGEX.test(username);
}

async function isValidId(id) {
  return ID_REGEX.test(id);
}

function isValidPassword(password) {
  return PASSWORD_REGEX.test(password);
}

module.exports = {
  isValidUsername,
  isValidId,
  isValidPassword
};