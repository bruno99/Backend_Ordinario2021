// Resolvers define the technique for fetching the types defined in the

import { ApolloError } from 'apollo-server';
import { PubSub } from 'graphql-subscriptions';
import { Collection, ObjectId } from 'mongodb';
import { pubsub } from './subscriptions';

// schema. This resolver retrieves books from the "books" array above.

const isResultValid = (newResult: string, prevResult: string) => {
  // Extraer las puntuaciones a variables
  // newResult = "80-90"
  // prevResult = "70-85"
  const splittedNewResult = newResult.split('-'); // ["80","90"]
  const splittedPrevResult = prevResult.split('-');
  const newResultFirstScore = parseInt(splittedNewResult[0]);
  const newResultSecondScore = parseInt(splittedNewResult[1]);
  const prevResultFirstScore = parseInt(splittedPrevResult[0]);
  const prevResultSecondScore = parseInt(splittedPrevResult[1]);

  if (
    newResultFirstScore > prevResultFirstScore &&
    newResultSecondScore > prevResultSecondScore
  ) {
    return true;
  }

  return false;
};

export const mutations = {
  Mutation: {
    setMatchData: async (
      parent: any,
      args: { id: string; result?: string; minute?: number; ended?: boolean },
      context: { matchesCollection: Collection }
    ) => {
      const { id, result, minute, ended } = args;

      // Comprobar que el partido existe
      const match = await context.matchesCollection.findOne({
        _id: new ObjectId(id),
      });

      if (!match) return new ApolloError('Not Found', '404');

      // Comprobar que el resultado es válido
      if (result && !isResultValid(result, match.result)) {
        return new ApolloError('Invalid new result', '442');
      }

      // Comprobar que los nuevos minutos son mayores que los anteriores
      if (minute && minute <= match.gameTime) {
        return new ApolloError('Invalid minute value', '442');
      }

      // Comprobar si el partido ya está finalizado
      if (match.finalized) {
        return new ApolloError('The match has already ended', '442');
      }

      const updateObject: any = {};

      if (result) {
        updateObject.result = result;

        pubsub.publish('RESULT_CHANGED', {
          subscribeMatch: { ...match, result, id },
        });
      }

      if (minute) {
        updateObject.gameTime = minute;
      }

      if (ended) {
        updateObject.finalized = ended;

        pubsub.publish('MATCH_ENDED', {
          subscribeMatch: { ...match, finalized: true, id },
        });
      }

      return await context.matchesCollection.updateOne(
        {
          _id: new ObjectId(id),
        },
        {
          $set: updateObject,
        }
      );
    },

    startMatch: async (
      parent: any,
      args: { team1: string; team2: string },
      context: { matchesCollection: Collection }
    ) => {
      const { team1, team2 } = args;

      try {
        const match1 = await context.matchesCollection.findOne({
          team1Name: team1,
          team2Name: team2,
          finalized: false,
        });

        const match2 = await context.matchesCollection.findOne({
          team1Name: team2,
          team2Name: team1,
          finalized: false,
        });

        if (match1 || match2)
          return new ApolloError('Match already exists', '442');

        const newMatch = {
          team1Name: team1,
          team2Name: team2,
          result: '0-0',
          gameTime: 0,
          finalized: false,
        };

        const result = await context.matchesCollection.insertOne(newMatch);

        return { id: result.insertedId, ...newMatch };
      } catch (error) {
        return new ApolloError((error as Error).message, '500');
      }
    },
  },
};
