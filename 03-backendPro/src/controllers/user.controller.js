import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

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
   console.log("email: ", email);
     
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
  console.log(email)

  // username or email
  if (!username || !email) {
      throw new ApiError(400, "username or email is required")
  }

  //Here is an alternative of above code based on logic discussed
 //   if (!username && !email) {
 //     throw new ApiError(400, "username and email is required")
 // }

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
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1 //this removes the field from document
      }
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
   }

   return res
   .status(200)
   .clearCookie("accessToken", options)
   .clearCookie("refreshToken", options)
   .json(new ApiResponse(200, {}, "User logged Out"))

})

  //RefreshAccessToken
  const refreshAccessToken = asyncHandler(async (req, res) => 
    {
      const incomingRefreshToken = req.cookies.
      refreshToken || req.body.refreshToken
     
      if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
      }

     try {
       const decodedToken = jwt.verify(
         incomingRefreshToken,
         process.env.REFRESH_TOKEN_SECRET
       )
 
       const user = await User.findById(decodedToken?._id)
 
       if (!user) {
         throw new ApiError(401, "Invalid refresh token")
       }
 
       if (incomingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401, "Refresh token is expired or used")
       }
 
       const options = {
         httpOnly: true,
         secure: true
       }
       // generateAccessAndRefreshTokens
       const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
 
       return res
       .status(200)
       .cookie("accessToken", accessToken, options)
       .cookie("refreshToken", newRefreshToken, options)
       .json(
         new ApiResponse(
           200,
           {
             accessToken,
             refreshToken: newRefreshToken
           },
           "Access token refreshed successfully"
         )
       )
 
     } catch (error) {
      throw new ApiError(401, error?.message ||
        "Invalid refresh token"
      )
     }


    }
  )
    // to change current password from user
  const changeCurrentPassword = asyncHandler(
    async(req, res) => {
      const {oldPassword, newPassword} = req.body

      
      //check either id or _id
      const user = await User.findById(req.user?._id)
      const isPasswordCorrect = await user.
      isPasswordCorrect(oldPassword)

      if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
      }

      user.password = newPassword
      await user.save({validateBeforeSave: false})

      return res
      .status(200)
      .json(new ApiResponse
        (200, {}, "Password Changes Successfully"))
    }
  )

  //get current user
  const getCurrentUser = asyncHandler(
    async(req, res) => {
      return res
      .status(200)
      .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
      ))

    }
  )
  
  // Account details update
  const updateAccountDetails = asyncHandler(
    async(req, res) => {
      const {fullName, email} = req.body

      if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
      }
      //find the user
      const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set: {
            fullName,
            email: email
          }
        },
        {new: true}
      ).select("-password")

      return res
      .status(200)
      .json(new ApiResponse(
        200,
         user, 
        "Account details updated successfully"
      ))

    }
  )

  //Files update
  const updateUserAvatar = asyncHandler(
    async(req, res) => {
      const avatarLocalPath = req.file?.path

      if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
      }
      //upload this avatar on cloudinary
      const avatar = await uploadOnCloudinary
      (avatarLocalPath)

      if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")
      }
      const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set: {
            avatar: avatar.url
          }
        },
        {new: true}
      ).select("-password ")

      return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          user,
          "Avatar image updated successfully"
        )
      )
    }
  )

  const updateUserCoverImage = asyncHandler(
    async(req, res) => {
      const coverImageLocalPath = req.file?.path

      if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
      }
      //upload this avatar on cloudinary
        
          const coverImage = await uploadOnCloudinary
      (coverImageLocalPath)

      if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on cover image")
      }
      const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
          $set: {
            coverImage: coverImage.url
          }
        },
        {new: true}
      ).select("-password ")

      return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          user,
          "Cover Image updated successfully"
        )
      )
    }
  )

  //get user channel profile
  const getUserChannelProfile = asyncHandler(
    async(res, req) => {
      const {username} = req.params

      if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
      }

      const channel = await User.aggregate([
        {
          $match: {
            username: username?.toLowerCase()
          }
        },
        {
          $lookup: {
             from: "subscriptions",  //convert lowercase with plural
             localField: "_id",
             foreignField: "channel",
             as: "subscribers" 
          }
        },
        {
          $lookup: {
            from: "subscriptions",  //convert lowercase with plural
             localField: "_id",
             foreignField: "subscriber",
             as: "subscribedTo" // no. of subscriber subscribed my channel
          }
        },
        {
          $addFields: {
            subscribersCount: {
              $size: "$subscribers"
            },
            channelsSubscribedToCount: {
              $size: "$subscribedTo"
            },
            isSubscribed: {
              $cond: {
                if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                then: true,
                else: false
              }
            }
          }
        },
        {
          $project: {
            fullName: 1,
            username: 1,
            subscribersCount: 1,
            channelsSubscribedToCount: 1,
            isSubscribed: 1,
            avatar: 1,
            coverImage: 1,
            email: 1
          }
        }
      ])
      if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
      }

      return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          channel[0],
          "user channel fetched successfully"
        )
      )

    }
  )

  //to add watch history

  const getWatchHistory = asyncHandler(
    async(req, res) => {
      const user = await User.aggregate([
        {
          $match: {
            _id: new mongoose.Types.ObjectId(req.user._id)
          // _id: mongoose.Types.ObjectId(req.user._id)
          }
        },
        {
          $lookup: {
            from: "Video", // check here video or videos
            localField: "watchHistory",
            foreignField: "_id",
            as: "watchHistory",
            pipeline: [
              {
                $lookup: {
                  from: "users",
                  localField: "owner",
                  foreignField: "_id",
                  as: "owner",
                  pipeline: [
                    {
                      $project: {
                        fullName: 1,
                        username: 1,
                        avatar: 1
                      }
                    }
                  ]
                }
              },
              {
                $addFields: {
                  owner: {
                    $first: "$owner"
                  }
                }
              }
            ]
          }
        }
      ])

      return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          user[0].watchHistory,
          "Watch History Patched Successfully"
        )
      )
    }
  )


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
}
