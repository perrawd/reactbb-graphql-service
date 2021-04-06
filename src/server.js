import express from 'express'
import helmet from 'helmet'
import { ApolloServer } from 'apollo-server-express'
import { ApolloGateway } from '@apollo/gateway'

// Initialize an ApolloGateway instance and pass service names and URLs.
const gateway = new ApolloGateway({
  serviceList: [
    { name: 'accounts', url: process.env.AUTH_DOMAIN },
    { name: 'accounts', url: process.env.RESOURCE_DOMAIN }
  ]
})

// Pass the ApolloGateway to the ApolloServer constructor
const server = new ApolloServer({
  gateway,
  // Disable subscriptions (not currently supported with ApolloGateway)
  subscriptions: false,
  /**
   * Access req and res in context.
   *
   * @param {object} args server app.
   * @param {object} args.req The request.
   * @param {object} args.res The res.
   * @returns {object} The req and res.
   */
  context: ({ req, res }) => ({ req, res })
})
