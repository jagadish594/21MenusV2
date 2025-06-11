export const schema = gql`
  type Mutation {
    suggestMealsFromPantry(itemNames: [String!]!): [String!] @requireAuth
  }
`
