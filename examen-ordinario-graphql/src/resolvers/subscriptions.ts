import { withFilter, PubSub } from 'graphql-subscriptions';

export const pubsub = new PubSub();

export const subscriptions = {
  Subscription: {
    subscribeMatch: {
      // More on pubsub below
      subscribe: withFilter(
        () => pubsub.asyncIterator(['MATCH_ENDED','RESULT_CHANGED']),
        (payload, variables) => {
            // Only push an update if the match is the one I'm subscribed to
            return (payload.subscribeMatch.id === variables.id);
          },
      )
    },
  },
};
