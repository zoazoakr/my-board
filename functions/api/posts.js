// functions/api/posts.js
import { verifyJwt } from '../utils/auth.js';

export async function onRequestGet(context) {
  const { env } = context;
  try {
    const { results } = await env.DB.prepare(`
      SELECT Posts.id, Posts.title, Posts.content, Posts.created_at, Users.username 
      FROM Posts 
      JOIN Users ON Posts.user_id = Users.id 
      ORDER BY Posts.created_at DESC
    `).all();

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    // Authenticate
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const match = cookieHeader.match(/token=([^;]+)/);
    if (!match) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const payload = await verifyJwt(match[1]);
    if (!payload) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { title, content } = await request.json();

    if (!title || !content) {
      return new Response(JSON.stringify({ error: 'Title and content are required.' }), { status: 400 });
    }

    const result = await env.DB.prepare(`
      INSERT INTO Posts (user_id, title, content) 
      VALUES (?, ?, ?)
    `).bind(payload.sub, title, content).run();

    return new Response(JSON.stringify({ message: 'Post created successfully', id: result.meta.last_row_id }), {
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
