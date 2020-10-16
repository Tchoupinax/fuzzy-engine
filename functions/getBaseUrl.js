export default function ({ url, username, password }) {
  let protocol = 'https';

  if (url.data.includes('localhost')) {
    protocol = 'http';
  }

  return `${protocol}://${username.data}:${password.data}@${url.data}`;
}
