//const asyncHandler = () => {}





export {asyncHandler}


 //const asyncHandler = () => {}
 //const asyncHandler = (fn) => () =>{}
 //const asyncHandler = (fn) => async () => {}

//higher order function
// const asyncHandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }