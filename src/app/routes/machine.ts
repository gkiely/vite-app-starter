import { createMachine, assign, interpret, DoneInvokeEvent } from 'xstate';
import { Post, postsSchema } from 'server/schemas';
import { CLIENT } from 'utils/constants';
import { delay } from 'utils';

type Context = {
  error: string;
  loading: string;
  count: number;
  posts: Post[];
};

export type Event =
  | {
      type: 'count.update';
      payload: { count: number };
    }
  | {
      type: 'post.create';
      payload: { title: string };
    }
  | {
      type: 'post.delete';
      payload: { id: string };
    };

/* c8 ignore start */
const fetchPosts = async () => {
  const res = await fetch('https://jsonplaceholder.typicode.com/posts');
  const json = await res.json<{ id: number; title: string }[]>();
  const posts = postsSchema.parse(
    json
      .map((post) => ({
        id: `${post.id}`,
        title: post.title,
      }))
      .slice(0, 5)
  );
  await delay(300);
  return posts;
};

// https://stately.ai/registry/editor/e258b6ae-322e-4669-b369-257314f2e17e
export const machine = createMachine<Context, Event>({
  initial: 'setup',
  predictableActionArguments: true,
  context: {
    error: '',
    loading: '',
    count: 0,
    posts: [],
  },
  on: {
    'count.update': {
      actions: assign({
        count: (context, event) => context.count + event.payload.count,
      }),
    },
  },
  states: {
    idle: {
      on: {
        'post.create': {
          actions: assign({
            posts: (context, event) => [
              ...context.posts,
              {
                id: `${context.posts.length + 1}`,
                title: event.payload.title,
              },
            ],
          }),
        },
        'post.delete': {
          actions: assign({
            posts: (context, event) => context.posts.filter(({ id }) => id !== event.payload.id),
          }),
        },
      },
    },
    setup: {
      entry: [
        assign({
          loading: 'Loading posts...',
        }),
      ],
      exit: [
        assign({
          loading: '',
        }),
      ],
      invoke: {
        id: 'fetchPosts',
        src: fetchPosts,
        onDone: {
          target: 'idle',
          actions: assign<Context, DoneInvokeEvent<Post[]>>({
            posts: (context, event) => [...context.posts, ...event.data],
          }),
        },
        onError: {
          target: 'idle',
          actions: assign<Context, DoneInvokeEvent<Post[]>>({
            error: 'Error loading posts',
          }),
        },
      },
    },
  },
});

const service = interpret(machine);
service.start();

if (CLIENT) {
  // @ts-expect-error - debugging
  window.service = service;
}

export default service;
/* c8 ignore stop */
