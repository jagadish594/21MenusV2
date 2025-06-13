export const schema = gql`
  type Category {
    id: Int!
    name: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    # pantryItems: [PantryItem!]
    # groceryListItems: [GroceryListItem!]
  }

  type Query {
    categories: [Category!]! @requireAuth
  }

  input CreateCategoryInput {
    name: String!
  }

  type Mutation {
    createCategory(input: CreateCategoryInput!): Category! @requireAuth
    deleteCategory(id: Int!): Category @requireAuth
  }
`
