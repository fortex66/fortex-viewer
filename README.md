# ForTex-Viewer : 웹 기반의 실시간 온도 모니터링 및 조회 & 저장 프로그램 🖥
 

## 프로젝트 소개 📝

**사이트 바로가기** : http://fortex66.cafe24app.com/

- 웹에서 실시간으로 온도값 모니터링과 데이터를 조회하고 관리할 수 있는 프로그램입니다.

- 오므론 E5CC온도계와 온도센서, LS PLC를 사용하여 임베디드를 구성하였고 PLC와 모드버스 TCP 통신을 통해 온도계의 설정값들을 읽어오는 Node.js 서버와 React 클라이언트로 소프트웨어를 구성하였습니다.

- 테스트 버전이며 주요 기능 및 업데이트 예정 사항들은 아래에 적어 두었습니다.

---

## 주요 기능 ⚙️

1. **실시간 온도값 모니터링**: 현재 온도가 설정 온도를 잘 따라가고 있는지 실시간으로 모니터링 할 수 있습니다.
2. **온도계 제어**: 사용자가 온도계의 ON/OFF와 온도를 직접 설정할 수 있습니다. 
3. **데이터 저장**: 10초마다 현재 온도값을 자동으로 데이터베이스에 저장합니다.
4. **데이터 불러오기**: 데이터베이스에 저장된 데이터를 날짜와 시간으로 조회하여 그래프로 보여줍니다.
5. **데이터 파일로 저장 및 그래프 캡쳐**: 조회한 데이터를 엑셀파일로 저장하거나 그래프를 사진으로 캡쳐할 수 있습니다.
6. **사용자 커스텀**: 프로그램의 자유도를 높히기 위해 사용자가 데이터 모니터링 주기, 그래프 축 설정, 그래프 색상등을 지정할 수 있습니다.
7. **방문자수 보기**: 전체 방문자수와 오늘 방문자수를 데이터베이스에 저장하고 볼 수 있습니다.

---

## 업데이트 예정 ⚙️

1. 화면 UI 재구성(비율)
2. 실시간 접속자 수
3. 자동 운전 모드 / 수동 운전 모드 선택
4. 로그인 기능 및 게스트 모드
5. 유동IP 문제 해결
6. 사용자의 프로그램 커스텀 기능
7. C#의 WinForm을 이용한 프로그램

---

## 개발환경 🖥

- **하드웨어**: 오므론 E5CC, LS PLC, 전기회로
- **소프트웨어**: Visual Studio Code 
- **개발도구**: Github
- **개발언어**: JavaScript
- **기타사항**: Node.js, Express.js, React, MySQL

---

## 실행방법 🛠
- IP주소와 데이터베이스 등 환경변수 파일을 올리지 않았기 때문에 파일자체는 실행되지 않습니다.
- 현재 테스트 버전으로 웹에 올려둔 상태입니다. 아래에 링크로 접속하시면 작동중인 테스트 버전을 확인하실 수 있습니다.
- http://fortex66.cafe24app.com/

---

## 주요 적용 기술 🛠

- React와 Node.js & Express.js를 활용한 웹 서버 구축
- MySQL을 사용하여 데이터베이스 구축
- PLC로 부터 데이터를 받아오기 위한 모드버스 TCP 통신 활용
- 실시간 Live Chart 구성




