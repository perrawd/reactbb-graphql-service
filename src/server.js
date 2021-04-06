import express from 'express'
import helmet from 'helmet'
import { ApolloServer } from 'apollo-server-express'
import { ApolloGateway } from '@apollo/gateway'

/**
 * The main function of the application.
 *
 * @returns {object} The server app.
 */
const main = async () => {
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

  await server.start()

  // Start Express server
  // Set various HTTP headers to make the application little more secure (https://www.npmjs.com/packagehelmet).
  const app = express()
  app.use(helmet({
    contentSecurityPolicy:
    (process.env.NODE_ENV === 'production')
      ? undefined
      : false
  }))

  // Error handler.
  app.use(function (err, req, res, next) {
    err.status = err.status || 500

    if (req.app.get('env') !== 'development') {
      res
        .status(err.status)
        .json({
          status: err.status,
          message: err.message
        })
      return
    }

    // Development only!
    // Only providing detailed error in development.
    return res
      .status(err.status)
      .json({
        status: err.status,
        message: err.message,
        innerException: err.innerException,
        stack: err.stack
      })
  })

  server.applyMiddleware({ app })

  await new Promise(resolve => app.listen({ port: `${process.env.PORT}` }, resolve))
  console.log(`🚀 Server ready at http://localhost:${process.env.PORT}${server.graphqlPath}`)

  return { server, app }
}

main().catch(console.error)
