export default function ({ url, username, password }) {
  return `https://${username.data}:${password.data}@${url.data}`;
}
