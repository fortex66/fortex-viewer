const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

// Sequelize 인스턴스 생성
const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE, 
  process.env.MYSQL_USERNAME, 
  process.env.MYSQL_PASSWORD, {
    host: process.env.MYSQL_HOST,
    dialect: 'mysql',
    timezone: '+09:00', // 서울 시간대
    port: process.env.MYSQL_PORT,
    logging: console.log, // 로깅 설정을 false로 하여 콘솔에 쿼리 로그를 출력하지 않음
  }
);


// 연결 테스트
sequelize.authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((error) => {
    console.error('Unable to connect to the database:', error);
  });

module.exports = sequelize;

