// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against

import { gql } from 'apollo-server';

// your data.
export const typeDefs = gql`
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  type Match {
    id: ID!
    team1Name: String
    team2Name: String
    result: String
    gameTime: Int
    finalized: Boolean
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each.
  type Query {
    listMatches: [Match]
    getMatch(id: ID!): Match
  }

  type Mutation {
    setMatchData(id: ID!, result: String, minute: Int, ended: Boolean): Match
    startMatch(team1: String!, team2: String!): Match
  }

  type Subscription {
    subscribeMatch(id: ID!): Match
  }
`;