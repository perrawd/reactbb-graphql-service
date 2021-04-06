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
