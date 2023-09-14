import express from "express";
import cors from "cors";
import { configDotenv } from "dotenv";
import bp from "body-parser";
import { createClient } from "@supabase/supabase-js";
import { generateAdvice } from "./openai.api.js";
const { json, urlencoded } = bp;

configDotenv();
const app = express();
const supabase = createClient(
  process.env["SUPABASE_URL"],
  process.env["SUPABASE_KEY"]
);

app.use(cors());
app.use(json());
app.use(urlencoded({ extended: false }));

app.get("/", async (req, res) => {
  res.send("I'm Alive!!!");
});

app.get("/posts", async (req, res) => {
  const posts = await supabase
    .from("posts")
    .select("*,user_id(*),comments(*),metrics(*)");
  res.send({ posts: posts.data });
});

app.post("/posts/add", async (req, res) => {
  console.log(req.body);
  const post = await supabase.from("posts").insert(req.body).select();
  const metrics = await supabase
    .from("metrics")
    .insert({ post_id: post.data[0]["id"] })
    .select();
  res.send({ post: post.data, metrics: metrics.data });
});

app.get("/post/:post_id", async (req, res) => {
  const post = await supabase
    .from("posts")
    .select("*, user_id(*), metrics(*)")
    .eq("id", req.params.post_id)
    .single();
  res.send({ post: post.data });
});

app.get("/post/:post_id/delete", async (req, res) => {
  const post = await supabase
    .from("posts")
    .delete()
    .eq("id", req.params.post_id);
  res.send({ message: `deleted post ${post_id}` });
});

app.post("/post/:post_id/comments", async (req, res) => {
  const response = await fetch(process.env["HUGGING_FACE_URL"], {
    method: "POST",
    headers: {
      authorization: "Bearer " + process.env["HUGGING_FACE_SECRET"],
    },
    body: JSON.stringify({ text: req.body.comment }),
  });
  const responseJson = await response.json();
  if (response.ok) {
    const label = responseJson[0].label;
    const { data, error } = await supabase.rpc(`increment_${label}_comments`, {
      row_id: req.params.post_id,
    });
    const comment = await supabase
      .from("comments")
      .insert({
        post_id: req.params.post_id,
        sentiment: label,
        content: req.body.comment,
      })
      .select()
      .single();
    res.send(comment.data);
  }
});

app.get("/post/:post_id/comments", async (req, res) => {
  const response = await supabase
    .from("comments")
    .select()
    .eq("post_id", req.params.post_id);
  res.send({ comments: response.data });
});

app.get("/post/:post_id/like", async (req, res) => {
  const { data, error } = await supabase.rpc(`increment_likes`, {
    post_id: req.params.post_id,
  });

  res.send(data);
});

app.get("/post/:post_id/view", async (req, res) => {
  const { data, error } = await supabase.rpc(`increment_views`, {
    post_id: req.params.post_id,
  });

  res.send(data);
});

app.post("/report/generate", async (req, res) => {
  const advice = await generateAdvice(req.body.advert, req.body.comments);
  res.send({ advice });
});

const port = process.env.PORT;
app.listen(port, function () {
  console.log(`Web server listening on port ${port}`);
});
