// functions/api/posts/[id].js
import { verifyJwt } from '../../utils/auth.js';

export async function onRequestGet(context) {
  const { env, params } = context;
  const postId = params.id;

  try {
    const post = await env.DB.prepare(`
      SELECT Posts.*, Users.username 
      FROM Posts 
      JOIN Users ON Posts.user_id = Users.id 
      WHERE Posts.id = ?
    `).bind(postId).first();

    if (!post) {
      return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });
    }

    const { results: comments } = await env.DB.prepare(`
      SELECT Comments.*, Users.username 
      FROM Comments 
      JOIN Users ON Comments.user_id = Users.id 
      WHERE Comments.post_id = ?
      ORDER BY Comments.created_at ASC
    `).bind(postId).all();

    return new Response(JSON.stringify({ post, comments }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}

export async function onRequestPut(context) {
  const { request, env, params } = context;
  const postId = params.id;

  try {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    const match = cookieHeader.match(/token=([^;]+)/);
    if (!match) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    const payload = await verifyJwt(match[1]);
    if (!payload) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const post = await env.DB.prepare('SELECT user_id FROM Posts WHERE id = ?').bind(postId).first();
    if (!post) return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });
    if (Number(post.user_id) !== Number(payload.sub)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

    const { title, content } = await request.json();
    if (!title || !content) return new Response(JSON.stringify({ error: 'Title and content required' }), { status: 400 });

    await env.DB.prepare('UPDATE Posts SET title = ?, content = ? WHERE id = ?')
      .bind(title, content, postId)
      .run();

    return new Response(JSON.stringify({ message: 'Post updated' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Update Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error: ' + error.message }), { status: 500 });
  }
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const postId = params.id;

  try {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    const match = cookieHeader.match(/token=([^;]+)/);
    if (!match) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    const payload = await verifyJwt(match[1]);
    if (!payload) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const post = await env.DB.prepare('SELECT user_id FROM Posts WHERE id = ?').bind(postId).first();
    if (!post) return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });
    if (Number(post.user_id) !== Number(payload.sub)) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

    await env.DB.prepare('DELETE FROM Posts WHERE id = ?').bind(postId).run();

    return new Response(JSON.stringify({ message: 'Post deleted' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Delete Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error: ' + error.message }), { status: 500 });
  }
}
