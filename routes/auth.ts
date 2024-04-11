import { Router } from "express";
import { sendVerificationLink, verifyEmailTokenInServer, verifyToken } from "../action"


const router = Router()

router.post("/sendVerificationLink", async (req : any, res: any) => {
    try {
    console.log("request came", req.query)
    await sendVerificationLink(req.query.email)
    res.json({success:true})
    } catch (err) {
        console.log("ERROR: " + err.message)
    }
})

function middleware(req, res, next) {
    console.log("middleware triggered ", req.query.token)
    verifyToken(req.query.token).then(msg => {
        console.log(msg);
        next()
    }).catch(err => {
        res.json({success: false})
    })
}

router.get("/verifyCookie", middleware, (req, res) => {
   res.json({success: true})
})

router.get("/verify", async (req, res) => {
    console.log("Verify triggered ", req.query.token)
    verifyEmailTokenInServer(req.query.token).then(message => {
        console.log(message)
        if (!message.error) {
            console.log("Verfied successfully ", message)
            res.redirect(process.env.CLIENT_IP  + "/join_room?setToken=" + message.msg)
        } else {
            res.redirect(process.env.CLIENT_IP  + "/login")
        }
    }, (err) => {
        console.log("Not verfied : ", err)
    }).catch(err => {
        console.log("error : ", err)
    })
})


export default router;