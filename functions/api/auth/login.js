// functions/api/auth/login.js
import { verifyPassword } from '../../utils/crypto.js';
import { createJwt } from '../../utils/auth.js';

export async function onRequestPost(context) {
  const { request, env } = context;
  
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ error: 'Username and password are required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = await env.DB.prepare('SELECT id, username, password_hash FROM Users WHERE username = ?')
      .bind(username)
      .first();

    if (!user) {
      return new Response(JSON.stringify({ error: 'Invalid credentials.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid credentials.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Create JWT token (expires in 24 hours)
    const payload = {
      sub: user.id,
      username: user.username,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60)
    };
    const token = await createJwt(payload);

    // Set HttpOnly Cookie
    const cookie = `token=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict`;

    return new Response(JSON.stringify({ message: 'Login successful.', user: { id: user.id, username: user.username } }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': cookie
      }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
