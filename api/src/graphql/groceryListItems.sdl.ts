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

  type AddPantryItemsToGroceryResult {
    addedCount: Int!
    skippedCount: Int!
    addedItems: [GroceryListItem!]!
    skippedItems: [String!]!
  }

  type Mutation {
    createGroceryListItem(input: CreateGroceryListItemInput!): GroceryListItem!
      @requireAuth
    updateGroceryListItem(
      id: Int!
      input: UpdateGroceryListItemInput!
    ): GroceryListItem! @requireAuth
    deleteGroceryListItem(id: Int!): GroceryListItem! @requireAuth
    addPantryItemsToGroceryList(
      inputs: [AddPantryItemToGroceryInput!]!
    ): AddPantryItemsToGroceryResult! @requireAuth
  }
`
