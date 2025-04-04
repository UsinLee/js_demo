const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public'));

let posts = []; // 메모리 기반 게시글 목록
let postId = 1;

app.get('/', (req, res) => {
  res.send('<h1>Welcome to My Server!</h1>');
});
// 📄 게시글 목록 조회
app.get('/posts', (req, res) => {
  res.json(posts);
});

// 📝 게시글 작성
app.post('/posts', (req, res) => {
  const { title, content } = req.body;
  const newPost = {
    id: postId++,
    title,
    content,
    createdAt: new Date()
  };
  posts.push(newPost);
  res.status(201).json(newPost);
});

// 🔍 게시글 하나 조회
app.get('/posts/:id', (req, res) => {
  const id = Number(req.params.id);
  const post = posts.find(p => p.id === id);
  if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
  res.json(post);
});

// ✏️ 게시글 수정
app.put('/posts/:id', (req, res) => {
  const id = Number(req.params.id);
  const { title, content } = req.body;
  const post = posts.find(p => p.id === id);
  if (!post) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
  post.title = title;
  post.content = content;
  res.json(post);
});

// 🗑️ 게시글 삭제
app.delete('/posts/:id', (req, res) => {
  const id = Number(req.params.id);
  const index = posts.findIndex(p => p.id === id);
  if (index === -1) return res.status(404).json({ message: '게시글을 찾을 수 없습니다.' });
  posts.splice(index, 1);
  res.status(204).send();
});

// 서버 실행
app.listen(PORT, () => {
  console.log(`📢 게시판 API 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
