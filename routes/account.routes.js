// import cors from 'cors'
import express from 'express'
import AccountController from '../controllers/account.controller.js';

const router = express.Router()

router.post("/", AccountController.createAccount)
router.get("/", AccountController.getAccounts)
router.get("/:id", AccountController.getAccount)
router.delete("/:id", AccountController.deleteAccount)
router.put("/", AccountController.updateAccount)
router.patch("/updateBalance", AccountController.updateBalance)

//Libera cors só para esse método
// router.get("/", cors(), async (req, res, next) => {
//     try {
//         const data = JSON.parse(await readFile(fileName))
//         delete data.nextId
//         res.send(data)
//         logger.info(`GET /account`)
//     } catch (err) {
//         next(err)
//     }
// })

router.use((err, req, res, next) => {
    logger.error(`${req.method} ${req.baseUrl} - ${err.message}`)
    res.status(400).send({ error: err.message })
})

export default router