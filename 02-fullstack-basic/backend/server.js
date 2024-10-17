import express from "express";
//if you want to use import express from "express"; the in the package.json add "type": "module"
import cors from "cors";
const app = express();

const port = process.env.PORT || 3000;
//middleware
app.use(express.static("dist"));
app.use(express.json());
app.use(cors());

app.get("/", (req, res) => {
    res.send("Server is running!");
});

//get a list of 5 jokes
app.get("/api/jokes", (req, res) => {
    const jokes = [
        {
            id:1,
            title:"Joke 1",
            content:"Joke 1 content"
        },
        {
            id:2,
            title:"Joke 2",
            content:"Joke 2 content"
        },
        {
            id:3,
            title:"Joke 3",
            content:"Joke 3 content"
        },
        {
            id:4,
            title:"Joke 4",
            content:"Joke 4 content"
        },
        {
            id:5,
            title:"Joke 5",
            content:"Joke 5 content"
        }
    ];

    res.json(jokes);
});

app.listen(port, () => {
    console.log(`app listening at http://localhost:${port}`);
});