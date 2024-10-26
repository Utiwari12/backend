import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"

// access and refesh token generation

const generateAccessAndRefreshTokens = async(userId)=>{
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({validateBeforeSave: false})

    return {accessToken, refreshToken}


  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token")
  }
}

const registerUser = asyncHandler( async (req, res) => {
    // res.status(200).json({
    //     message: "ok, from U Tiwari"
    // })

    // Logic Building process
    // get user details from frontend

    // validation - not empty
    // check if user already exists: username, email
    //check for images, check for avatar
    //upload them to cloudinary, avatar
   // create user object - create entry in db
   // remove password and refesh token field from response
   // check for user creation
   // return response


   // get user details from frontend
   const {fullName, email, username, password} = req.body
   //console.log("email: ", email);
     
    // validation - not empty

     //    if (fullName === "") {
    //       throw new ApiError(400, "fullName is required")
   //    }
   if (
    [fullName, email, username, password].some((field) => 
        field?.trim() === "")
   ) {
      throw new ApiError(400, "All fields are required")
   }
 
   // check if user already exists: username, email
   //User.findOne({email})
   const existedUser = await User.findOne({
    $or: [{ username }, { email }]
   })

   if (existedUser) {
    throw new ApiError(409, "User with email or username already exist")
    
   }
   //console.log(req.files);
   
  // multer gives
  //check for images, check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  //const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage)
     && req.files.coverImage.length>0) {
    coverImageLocalPath = req.files.coverImage[0].
    path
    
  }

  if (!avatarLocalPath) {
     throw new ApiError(400, "Avatar file is required")
  }

  //upload them to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  if (!avatar) {
    throw new ApiError(400, "Avatar file is required")
  }

  // create user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage:coverImage ? coverImage.url :  "",
    email,
    password,
    username: username.toLowerCase()
  })

  // remove password and refesh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  // check for user creation
  if (!createdUser) {
     throw new ApiError(500, "Somthing went wrong while registering the user")
  }

  // return response
  return res.status(201).json(
    new ApiResponse(
      200, createdUser, "User registered Successfully"
    )
  )

} )
 
 // login User
const loginUser = asyncHandler(async (req, res) =>{
  // req body take data of following steps
  // username or email
  // find the user
  // password check
  // access and refesh token
  // send cookie

  const {email, username, password} = req.body

  // username or email
  if (!username || !email) {
      throw new ApiError(400, "username or password is required")
  }

  const user = await User.findOne({
    $or: [{username}, {email}]
  })

  // find the user
  if (!user) {
    throw new ApiError(404, "User does not exist")
  }

  // password check

  const isPasswordValid = await user.isPasswordCorrect
  (password)

  if (!isPasswordValid) {
    throw new ApiError(401, "Password does not exist or invalid user credentials")
  }

  // access and refesh token generation
  const {accessToken, refreshToken} = await 
  generateAccessAndRefreshTokens(user._id)

 // send cookie
 const loggedInUser = await User.findById(user._id).
 select("-password -refreshToken")

 const options = {
  httpOnly: true,
  secure: true
 }

 return res
 .status(200)
 .cookie("accessToken", accessToken, options)
 .cookie("refreshToken", refreshToken, options)
 .json(
  new ApiResponse(
    200,
    {
      user: loggedInUser, accessToken, refreshToken
    },
    "User logged In Successfully"
  )
 )

})

// logout user

const logoutUser = asyncHandler(async(req, res) =>{

})

export {
  registerUser,
  loginUser,
  logoutUser
}
