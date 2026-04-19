// functions/api/posts/[id]/comments.js
import { verifyJwt } from '../../../utils/auth.js';

export async function onRequestPost(context) {
  const { request, env, params } = context;
  const postId = params.id;

  try {
    const cookieHeader = request.headers.get('Cookie');
    if (!cookieHeader) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    const match = cookieHeader.match(/token=([^;]+)/);
    if (!match) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    const payload = await verifyJwt(match[1]);
    if (!payload) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

    const { content } = await request.json();
    if (!content) return new Response(JSON.stringify({ error: 'Content required' }), { status: 400 });

    const post = await env.DB.prepare('SELECT id FROM Posts WHERE id = ?').bind(postId).first();
    if (!post) return new Response(JSON.stringify({ error: 'Post not found' }), { status: 404 });

    await env.DB.prepare('INSERT INTO Comments (post_id, user_id, content) VALUES (?, ?, ?)')
      .bind(postId, payload.sub, content)
      .run();

    return new Response(JSON.stringify({ message: 'Comment created' }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
