import express from 'express'
import helmet from 'helmet'
import { ApolloServer } from 'apollo-server-express'
import { ApolloGateway, RemoteGraphQLDataSource } from '@apollo/gateway'

/**
 * The main function of the application.
 *
 * @returns {object} The server app.
 */
const main = async () => {
  // Initialize an ApolloGateway instance and pass service names and URLs.
  const gateway = new ApolloGateway({
    serviceList: [
      { name: 'auth', url: process.env.AUTH_DOMAIN },
      { name: 'resource', url: process.env.RESOURCE_DOMAIN }
    ],
    /**
     * BuildService called once for each implementing service.
     * Returns an object that implements the GraphQLDataSource interface.
     *
     * @param {object} args arguments.
     * @param {object} args.name name.
     * @param {object} args.url url.
     * @returns {object} The server app.
     */
    buildService ({ name, url }) {
      return new RemoteGraphQLDataSource({
        url,
        /**
         * Takes a requestContext object that contains both...
         * the original unmodified request and the current context.
         *
         * @param {object} args arguments.
         * @param {object} args.request The request object.
         * @param {object} args.context The context object.
         */
        willSendRequest ({ request, context }) {
          if (context.req === undefined) {
            return
          }
          request.http.headers.set(
            'authorization',
            context.req.headers.authorization
              ? context.req.headers.authorization
              : null
          )
        }
      })
    }
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
