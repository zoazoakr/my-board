// functions/api/auth/register.js
import { hashPassword } from '../../utils/crypto.js';

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

    // Check if user exists
    const existingUser = await env.DB.prepare('SELECT id FROM Users WHERE username = ?')
      .bind(username)
      .first();

    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Username already exists.' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Insert user
    await env.DB.prepare('INSERT INTO Users (username, password_hash) VALUES (?, ?)')
      .bind(username, passwordHash)
      .run();

    return new Response(JSON.stringify({ message: 'User registered successfully.' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
