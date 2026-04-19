// functions/api/auth/me.js
import { verifyJwt } from '../../utils/auth.js';

export async function onRequestGet(context) {
  const { request } = context;
  
  try {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const match = cookieHeader.match(/token=([^;]+)/);
    if (!match) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const token = match[1];
    const payload = await verifyJwt(token);

    if (!payload) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    return new Response(JSON.stringify({ user: { id: payload.sub, username: payload.username } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  // Logout by clearing cookie
  const cookie = `token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict`;
  return new Response(JSON.stringify({ message: 'Logged out successfully' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': cookie
    }
  });
}
