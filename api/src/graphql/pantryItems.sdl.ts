export const schema = gql`
  enum PantryItemStatus {
    InStock
    OutOfStock
  }

  type PantryItem {
    id: Int!
    name: String!
    category: String # Optional
    quantity: String
    notes: String
    order: Int # New field
    status: PantryItemStatus!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    pantryItems: [PantryItem!]! @requireAuth
    pantryItem(id: Int!): PantryItem @requireAuth
  }

  input CreatePantryItemInput {
    name: String!
    category: String
    order: Int
    quantity: String
    notes: String
    status: PantryItemStatus
  }

  input UpdatePantryItemInput {
    name: String
    category: String
    quantity: String
    notes: String
    order: Int
    status: PantryItemStatus
  }

  input UpsertPantryItemFromGroceryInput {
    name: String!
    category: String!
    quantity: String
    notes: String
    # status is implicitly InStock when upserting from a purchased grocery item
  }

  input UpdatePantryItemOrderInput {
    id: Int!
    order: Int!
    category: String # Optional, if category is changing
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
  }
`
