export const schema = gql`
  enum PantryItemStatus {
    InStock
    OutOfStock
    LowStock
  }

  type PantryItem {
    id: Int!
    name: String!
    quantity: String
    notes: String
    order: Int
    status: PantryItemStatus!
    createdAt: DateTime!
    updatedAt: DateTime!

    categoryId: Int
    category: Category
  }

  type Query {
    pantryItems: [PantryItem!]! @requireAuth
    pantryItem(id: Int!): PantryItem @requireAuth
  }

  input CreatePantryItemInput {
    name: String!
    categoryId: Int
    order: Int
    quantity: String
    notes: String
    status: PantryItemStatus
  }

  input UpdatePantryItemInput {
    name: String
    categoryId: Int
    quantity: String
    notes: String
    order: Int
    status: PantryItemStatus
  }

  input UpsertPantryItemFromGroceryInput {
    name: String!
    categoryId: Int!
    quantity: String
    notes: String
    # status is implicitly InStock when upserting from a purchased grocery item
  }

  input UpdatePantryItemOrderInput {
    id: Int!
    order: Int!
    categoryId: Int # Optional, if category is changing
  }

  type ClearPantryPayload {
    count: Int!
    message: String!
  }

  input SyncGroceryItemToPantryInput {
    groceryListItemId: Int!
  }

  type SyncPantryItemPayload {
    pantryItem: PantryItem # The affected (created/updated) pantry item, or null
    message: String!
    groceryListItem: GroceryListItem! # The updated grocery list item
  }

  type Mutation {
    createPantryItem(input: CreatePantryItemInput!): PantryItem! @requireAuth
    updatePantryItem(id: Int!, input: UpdatePantryItemInput!): PantryItem!
      @requireAuth
    deletePantryItem(id: Int!): PantryItem! @requireAuth
    updatePantryItemOrders(
      inputs: [UpdatePantryItemOrderInput!]!
    ): [PantryItem!]! @requireAuth
    upsertPantryItemFromGroceryItem(
      input: UpsertPantryItemFromGroceryInput!
    ): PantryItem! @requireAuth
    clearPantry: ClearPantryPayload! @requireAuth
    syncGroceryItemToPantry(input: SyncGroceryItemToPantryInput!): SyncPantryItemPayload! @requireAuth
  }
`
