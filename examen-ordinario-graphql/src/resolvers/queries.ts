// Resolvers define the technique for fetching the types defined in the

import { ApolloError } from 'apollo-server';
import { Collection, ObjectId } from 'mongodb';

// schema. This resolver retrieves books from the "books" array above.

export const queries = {
  Query: {
    listMatches: async (
      parent: any,
      args: any,
      context: { matchesCollection: Collection }
    ) => {
      const matches = await context.matchesCollection
        .find({ finalized: false })
        .toArray();

      return matches.map(({ _id, ...match }) => ({
        id: _id,
        ...match,
      }));
    },
    getMatch: async (
      parent: any,
      args: { id: string },
      context: { matchesCollection: Collection }
    ) => {
      const match = await context.matchesCollection.findOne({
        _id: new ObjectId(args.id),
      });

      if (match) return match;

      return new ApolloError('Not Found', '404');
    },
  }
};
