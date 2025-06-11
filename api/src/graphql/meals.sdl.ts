export const schema = gql`
  type Query {
    getMealDetails(mealName: String!): String @skipAuth
  }
`
