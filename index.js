import express from 'express'
import winston from 'winston'
import cors from 'cors'
import accountsRouter from "./routes/account.routes.js"
import { promises as fs } from 'fs'
import { buildSchema } from 'graphql'
import { graphqlHTTP } from 'express-graphql'
import AccountService from './services/account.service.js'
import Schema from './schema/index.js'
import basicAuth from 'express-basic-auth'

const { readFile, writeFile } = fs

global.fileName = "accounts.json"

const { combine, timestamp, label, printf } = winston.format
const myFormat = printf(({ level, message, label, timestamp }) => {
    return `${timestamp} [${label}] ${level}: ${message}`
})
global.logger = winston.createLogger({
    level: "silly",
    transports: [
        new (winston.transports.Console)(),
        new (winston.transports.File)({ filename: "my-bank-api.log" })
    ],
    format: combine(
        label({ label: "my-bank-api" }),
        timestamp(),
        myFormat
    )
})


// const schema = buildSchema(`
//     type Account {
//         id: Int
//         name: String
//         balance: Float
//     }
//     input AccountInput {
//         id: Int
//         name: String
//         balance: Float
//     }
//     type Query {
//         getAccounts: [Account]
//         getAccount(id: Int): Account
//     }
//     type Mutation {
//         createAccount(account: AccountInput): Account
//         deleteAccount(id: Int): Boolean
//         updateAccount(account: AccountInput): Account
//     }
// `)

// const root = {
//     getAccounts: () => AccountService.getAccounts(),
//     getAccount(args) {
//         return AccountService.getAccount(args.id)
//     },
//     createAccount({ account }) {
//         return AccountService.createAccount(account)
//     },
//     deleteAccount(args) {
//         AccountService.deleteAccount(args.id)
//     },
//     updateAccount({ account }) {
//         return AccountService.updateAccount(account)
//     }
// }


const app = express()
app.use(express.json())
// Libera o cors em todo projeto
app.use(cors())

function getRole(username) {
    if (username == 'admin') {
        return 'admin'
    } else if (username == 'angelo') {
        return 'role1'
    }
}

function authorize(...allowed) {
    const isAllowed = role => allowed.indexOf(role) > -1
    return (req, res, next) => {
        if (req.auth.user) {
            const role = getRole(req.auth.user)
            if (isAllowed(role)) {
                next()
            } else {
                res.status(401).send('Role not allowed')
            }
        } else {
            res.status(403).send('User not found')
        }
    }
}

app.use(basicAuth({
    authorizer: (username, password) => {
        const userMatches = basicAuth.safeCompare(username, 'admin')
        const pwdMatches = basicAuth.safeCompare(password, 'admin')

        const user2Matches = basicAuth.safeCompare(username, 'angelo')
        const pwd2Matches = basicAuth.safeCompare(password, '1234')

        return userMatches && pwdMatches || user2Matches && pwd2Matches
    }
}))

app.use("/account", authorize('admin', 'role1'), accountsRouter)

app.use("/graphql", graphqlHTTP({
    schema: Schema,
    // rootValue: root,
    graphiql: true
}))

app.listen(3000, async () => {
    try {
        await readFile(fileName)
        logger.info("API Started!")
    } catch (err) {
        const initialJson = {
            nextId: 1,
            accounts: []
        }
        writeFile(fileName, JSON.stringify(initialJson)).then(() => {
            logger.info("API Started and File Created")
        }).catch(err => {
            logger.error(err)
        })
    }
})
