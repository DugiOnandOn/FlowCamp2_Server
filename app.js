const express = require('express');
const router = express.Router();
const app = express();
const session = require('express-session');
const MemoryStore = require('memorystore')(session);
const cookieParser = require('cookie-parser');

const auth = require('./routers/auth');
const user = require('./routers/user');
const mytravel = require('./routers/mytravel');
const post = require('./routers/travelpost');
const plan = require('./routers/travelplan');

// 세션 설정
app.use(cookieParser());
app.use(session({
  key: "loginData",
  secret: 'djwjfkrh', // 세션 데이터를 암호화하기 위한 비밀키
  resave: false, // 요청이 왔을 때 세션을 항상 저장할지 여부
  store: new MemoryStore({
    checkPeriod: 86400000, // 만료된 세션을 검사할 주기(기본값: 1일)
  }),
  cookie: {
    maxAge: 86400000, // 세션 쿠키의 만료 시간(기본값: 1일)
    secure: false, // HTTPS가 아닌 환경에서도 사용 가능하도록 설정
  },
}));

// 세션 체크 미들웨어
const checkSession = (req, res, next) => {
  if (!req.session.loginData) {
    return res.status(401).json({error: "No login"});
  } else {
    next(); // 다음 미들웨어 또는 라우터로 제어를 넘김
  }
};

app.use(router);
app.use(express.static('public'));
app.use(express.urlencoded({extended: false}));
app.use('/', auth);

app.use(checkSession);

app.use('/user', user);
app.use('/mytravel', mytravel);
app.use('/travelpost', post);
app.use('/travelplan', plan);

// 서버 시작
app.listen(80, () => {
  console.log('Server started on port 80');
});
