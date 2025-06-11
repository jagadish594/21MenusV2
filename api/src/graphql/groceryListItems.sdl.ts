export const schema = gql`
  type GroceryListItem {
    id: Int!
    name: String!
    category: String
    purchased: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    groceryListItems: [GroceryListItem!]! @requireAuth
    groceryListItem(id: Int!): GroceryListItem @requireAuth
  }

  input CreateGroceryListItemInput {
    name: String!
    category: String
    purchased: Boolean
  }

  input AddPantryItemToGroceryInput {
    name: String!
    category: String
    quantity: String # From pantry item, can be null
  }

  input UpdateGroceryListItemInput {
    name: String
    category: String
    purchased: Boolean
  }

  type CreateMultipleGroceryListItemsResult {
    addedCount: Int!
    skippedCount: Int!
    addedItems: [GroceryListItem!]
    skippedItems: [String!]
  }

  type AddPantryItemsToGroceryResult {
    addedCount: Int!
    skippedCount: Int!
    addedItems: [GroceryListItem!]!
    skippedItems: [String!]!
  }

  type BatchDeleteResult {
    count: Int!
  }

  type Mutation {
    createGroceryListItem(input: CreateGroceryListItemInput!): GroceryListItem!
      @requireAuth
    updateGroceryListItem(
      id: Int!
      input: UpdateGroceryListItemInput!
    ): GroceryListItem! @requireAuth
    deleteGroceryListItem(id: Int!): GroceryListItem! @requireAuth
    createMultipleGroceryListItems(
      inputs: [CreateGroceryListItemInput!]!
    ): CreateMultipleGroceryListItemsResult! @requireAuth

    addPantryItemsToGroceryList(
      inputs: [AddPantryItemToGroceryInput!]!
    ): AddPantryItemsToGroceryResult! @requireAuth
    deleteGroceryListItemsByCategory(category: String!): BatchDeleteResult!
      @requireAuth
  }
`
