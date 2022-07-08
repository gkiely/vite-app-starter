import { Hono } from 'hono';
import { prettyJSON } from 'hono/pretty-json';
import { bodyParse } from 'hono/body-parse';
import { z } from 'zod';

const postSchema = z.object({
  id: z.string(),
  title: z.string(),
});
export const postsSchema = z.array(postSchema);
export type Post = z.infer<typeof postSchema>;

const app = new Hono();
export const posts: Post[] = [
  { id: '1', title: 'Good Morning' },
  { id: '2', title: 'Good Aternoon' },
  { id: '3', title: 'Good Evening' },
  { id: '4', title: 'Good Night' },
];

app.get('/api/posts', prettyJSON(), c => {
  return c.json(posts);
});

app.get('/api/post/:id', async c => {
  const id = c.req.param('id');
  const post = posts.find(p => p.id === id);
  if (!post) {
    return c.notFound();
  }
  return c.json<Post>(post);
});

app.post('/api/post/:id', bodyParse(), async c => {
  try {
    const { req } = c;
    const id = req.param('id');
    const post = postSchema.parse({
      ...req.parsedBody,
      id,
    });
    posts.push(post);
    return c.json<Post[]>(posts);
  } catch (err) {
    return c.json(err, 400);
  }
});

export default app;
