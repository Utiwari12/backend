import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { Comment } from "../models/comment.model";
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"


const getVideoComment = asyncHandler(
    async(req, res) => {
        //Todo: get all comments for a video
        try {
            const { videoId } = req.params;
            const { page = 1, limit = 10 } = req.query;
      
            const comments = await Comment.find({ video: videoId })
              .populate('user', 'name profilePicture')
              .sort({ createdAt: -1 })
              .skip((page - 1) * limit)
              .limit(limit);
      
            const totalComments = await Comment.countDocuments({ video: videoId });
      
            res.json({
              comments,
              totalPages: Math.ceil(totalComments / limit),
              currentPage: page,
            });
          } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Error getting comments' });
          }
    }
)

const addComment = asyncHandler(async(req, res) =>
{
    //TODO: add a comment to a video
    const {videoId, comment} = req.body

    const video = await video.findById(videoId)
    if (!video) {
                throw new ApiError(404, "video not founf")
    }

    const newComment = new Comment(
        {
            text: comment,
            video: videoId,
            user: req.user._id
        }
    )

         await newComment.save()
         video.comments.push(newComment._id);
         await video.save();

         return res
         .status(200)
         .json(
            new ApiResponse(
                video,
                "Comment Added Successfully"
            )
         )


    // try {
    //     const {videoId, comment} = req.body
    //     const video = await video.findById(videoId)
    //     if (!video) {
    //         return res
    //         .status(404)
    //         .json({message: "video not found"})
    //     }
    //     const newComment = new Comment(
    //         {
    //             text: comment,
    //             video: videoId,
    //             user: req.user._id
    //         },
    //     );
    //     await newComment.save()
    //     video.comments.push(newComment._id);
    //     await video.save();
    //     res.json({message: "comment added successfully"})
    // } catch (error) {
    //     console.error(error)
    //     res
    //     .status(500)
    //     .json({message: 'Error adding comment'})
    // }
})

const updateComment = asyncHandler(async(req, res) =>
{
    //TODO: update a comment
    //code from codeium
    try {
        const { commentId, text } = req.body;
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    if (comment.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'You are not authorized to update this comment' });
    }
        comment.text = text;
        await comment.save();
        res.json({ message: 'Comment updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating comment' });
    }
})

const deleteComment = asyncHandler(async(req, res) =>{
    //TODO: delete a comment
    try {
        const { commentId } = req.params;
        const comment = await Comment.findById(commentId);
        if (!comment) {
          return res.status(404).json({ message: 'Comment not found' });
        }
        if (comment.user.toString() !== req.user._id.toString()) {
          return res.status(401).json({ message: 'You are not authorized to delete this comment' });
        }
        await comment.deleteOne();
        res.json({ message: 'Comment deleted successfully' });
      } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error deleting comment' });
      }
})




export {
    getVideoComment,
    addComment,
    updateComment,
    deleteComment
}