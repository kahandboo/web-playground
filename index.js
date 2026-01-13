const app = require('./app');
const { initDB } = require('./db');

(async () => {
  try {
    await initDB();
    app.listen(3000, () => {
      console.log('서버 시작');
    });
  } catch (err) {
    console.error('서버 시작 실패:', err);
  }
})();