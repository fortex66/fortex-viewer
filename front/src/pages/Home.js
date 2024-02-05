import React, { useState, useEffect, useContext } from 'react';
import styled from "styled-components";
import moment from 'moment';
import { Line } from 'react-chartjs-2';
import 'chartjs-adapter-moment';
import {
    readCurrentTemperature,
    readSettingTemperature,
    writeSetTemperature,
    readThermostatStatus,
    writeThermostatControl,
} from '../services/api';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    TimeSeriesScale,
  } from 'chart.js';

import Header from '../components/Header'
import Sidebar from '../components/Sidebar';
import { ThemeContext } from '../style/theme';
import { useSettings } from '../contexts/SettingContext';


ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    TimeSeriesScale
  );

const Home = () => {
    const [settingTemp, setSettingTemp] = useState('');
    const [currentTemp, setCurrentTemp] = useState(null);
    const [setTemp, setSetTemp] = useState('');
    const [thermostatStatus, setThermostatStatus] = useState(null);
    const [tempStatus, setTempStatus] = useState(false);
    const [refreshSettingTemp, setRefreshSettingTemp] = useState(false);
    const [currentTempData, setCurrentTempData] = useState([]); // 현재 온도값 배열 최대 60개

    const { isDark } = useContext(ThemeContext);
    const { refreshInterval, graphSetMax, graphSetMin, color, darkcolor } = useSettings();

    // 상한값과 하한값 정의
    const MAX_TEMP = 60;
    const MIN_TEMP = 10;

    // 설정 온도 읽기
    useEffect(() => {
        readSettingTemperature().then(response => {
            setSettingTemp(response.data);
        }).catch(error => console.error('Error:', error));
    }, [refreshSettingTemp]); // 세팅 온도를 바꾸면 다시 읽어와서 표시


    // 현재 온도 읽기
    useEffect(() => {
        // interval을 설정하여 주기적으로 데이터를 서버로 부터 받아옴
        const interval = setInterval(() => {
            readCurrentTemperature().then(response => {
                setCurrentTemp(response.data);
                setCurrentTempData(prevData => {
                    const newData = [...prevData, { x: moment().valueOf(), y: response.data }]
                    if (newData.length > 60) {
                        newData.shift(); // 배열의 첫 번째 요소 제거 -> 최소 10분(10초일 때) 
                    }
                    return newData;
                });
            }).catch(error => console.error('Error:', error));
        }, refreshInterval);
        return () => clearInterval(interval);
    }, [refreshInterval]);

    // 온도계 상태 읽어오기
    useEffect(() => {
        readThermostatStatus().then(response => {
            setThermostatStatus(response.data);
        }).catch(error => console.error('Error:', error));
    }, [tempStatus]);

    const handleSetTempSubmit = () => {
        const value = parseFloat(setTemp); // 입력값을 숫자로 변환
        // 입력값이 상한값과 하한값 사이에 있는지 검증
        if (value < MIN_TEMP || value > MAX_TEMP) {
            // 사용자에게 경고 메시지를 보여주고 함수 실행을 중단
            alert(`온도 설정은 ${MIN_TEMP}°C와 ${MAX_TEMP}°C 사이여야 합니다.`);
            return; // 함수 실행 중단
        }

        // API 호출을 위한 온도 값 조정 (예시에서는 °C 값을 10배하여 전송)
        writeSetTemperature(value * 10).then(response => {
            console.log('Set temperature:', response.data);
            setRefreshSettingTemp(prev => !prev);
            setSetTemp(''); // 입력 필드 초기화
        }).catch(error => {
            console.error('Error:', error);
            setSetTemp('오류발생'); // 오류 메시지 설정
        });
    };

    // 온도계 Start / Run 변경
    const handleThermostatControl = (control) => {
        writeThermostatControl(control).then(response => {
            console.log('Thermostat control:', response.data);
            setTempStatus(prev => !prev);
        }).catch(error => console.error('Error:', error));
    };

    // 온도계 상태를 문자열로 반환
    const getThermostatStatusText = (status) => {
        switch (status) {
            case 768: return "OFF";
            case 512: return "ON";
            default: return "unknown";
        }
    };


    // 차트 데이터 설정
    const chartData = {
        labels: currentTempData.map(data => data.x),
        datasets: [{
            label: '현재 온도',
            data: currentTempData.map(data => ({ x: data.x, y: data.y })),
            fill: false,
            backgroundColor: isDark ? darkcolor : color,
            borderColor: isDark ? darkcolor : color,
            pointRadius: 4, // 데이터 포인트의 반지름을 5픽셀로 설정
            pointHoverRadius: 7, // 마우스 오버 시 데이터 포인트의 반지름을 7픽셀로 설정
        }],
    };
    
    // 차트 옵션
    const chartOptions = {
        scales: {
            x: { // x축 시간 축 설정
                type: 'time',
                time: {
                    unit: 'second', // 시간 단위를 '초'로 설정
                    tooltipFormat: 'll HH:mm:ss', // 툴팁에 표시될 시간 형식
                    displayFormats: {
                        second: 'HH:mm:ss', // x축 레이블에 표시될 시간 형식
                    },
                },
                title: {
                    display: true,
                    text: '시간',
                    color: isDark ? '#FEFEFE' : '#202124'
                },
                ticks: {
                    color: isDark ? '#FEFEFE' : '#202124', // x축 레이블 색상
                },
                grid: {
                    color: isDark ? 'rgba(254, 254, 254, 0.1)' : 'rgba(19, 18, 19, 0.1)', // x축 그리드 라인 색상
                },
                // x축 범위 조정을 위한 추가 설정
                min: currentTempData.length > 0 ? currentTempData[0].x : moment().subtract(5, 'minutes').valueOf(),
                max: moment().valueOf(),
            },
            y: {
                ticks: {
                    color: isDark ? '#FEFEFE' : '#202124', // y축 레이블 색상
                },
                grid: {
                    color: isDark ? 'rgba(254, 254, 254, 0.1)' : 'rgba(19, 18, 19, 0.1)', // y축 그리드 라인 색상
                },
                min: graphSetMin,
                max: graphSetMax
                
            },
        },
        plugins: {
            legend: { // 범례 설정
                labels: {
                    // 범례 레이블의 색상을 조건부로 설정
                    color: isDark ? '#FEFEFE' : '#131213',
                }
            }
        }
    };

    return (
        <div>
            <Header></Header>
            <Body>
                <Sidebar></Sidebar>
                <Contents isDark={isDark}>
                    <Name isDark={isDark}>온도 모니터링</Name>
                    <StatusContainer>
                        <StatusItem>
                            <Label isDark={isDark}>설정 온도</Label>
                            <Value isDark={isDark}>{settingTemp}°C</Value>
                        </StatusItem>
                        <StatusItem>
                            <Label isDark={isDark}>현재 온도</Label>
                            <Value isDark={isDark}>{currentTemp}°C</Value>
                        </StatusItem>
                        <StatusItem>
                            <Label isDark={isDark}>온도계 상태</Label>
                            <StatusValue status={thermostatStatus}>{getThermostatStatusText(thermostatStatus)}</StatusValue>
                        </StatusItem>
                    </StatusContainer>
                    <div>
                        <Line data={chartData} options={chartOptions} />
                    </div>
                    <Name isDark={isDark}>온도 제어</Name>
                    <ControlContainer>
                        <InputContainer>
                            <Label isDark={isDark}>온도계 스위치</Label>
                            <ToggleSwitch>
                            <Checkbox
                                type="checkbox"
                                checked={thermostatStatus === 512} // ON 상태일 때 체크된 상태로 표시
                                onChange={() => handleThermostatControl(thermostatStatus === 768 ? 1 : 0)} // 현재 상태가 OFF면 ON으로, ON이면 OFF로 변경
                            />
                            <Slider />
                            </ToggleSwitch>
                        </InputContainer>
                        <InputContainer>
                            <Label isDark={isDark} >온도 설정</Label>
                            <InputContents>
                                <Input type="number" value={setTemp} onChange={(e)=>setSetTemp(e.target.value)} />
                                <Button onClick={handleSetTempSubmit}>설정</Button>
                            </InputContents>
                        </InputContainer>
                    </ControlContainer>
                </Contents>
            </Body>
        </div>
    );
};

export default Home;

const Body = styled.div`
    display: flex;
    width: 100%; // 전체 가로 폭을 사용하도록 설정
`;

const Contents = styled.div`
    flex-grow: 1; // 사용 가능한 공간을 모두 차지하도록 설정
    padding: 20px; // 콘텐츠 내부 여백 설정
    background-color: ${({ isDark }) => isDark ? '#131213' : '#FEFEFE'}; /* 조건부 스타일 */
`;


const Name = styled.div`
    font-size : 24px;
    font-weight: bold;
    margin: 5px 0px 5px 10px;  
    color: ${({ isDark }) => isDark ? '#FEFEFE' : '#131213'}; /* 조건부 스타일 */
`

const StatusContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 20px;
`;

const StatusItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px;
`;

const Label = styled.span`
  font-size: 20px;
  font-weight: bold;
  color: ${({ isDark }) => isDark ? '#E3E1E3' : '#666'}; /* 조건부 스타일 */

`;

const Value = styled.span`
  margin-top: 10px;
  font-size: 18px;
  font-weight: bold;
  color: ${({ isDark }) => isDark ? '#E3E1E3' : '#333'}; /* 조건부 스타일 */
`;

const StatusValue = styled.span`
  margin-top: 10px;
  font-size: 18px;
  font-weight: bold;
  color: ${({ status }) => status === 512 ? 'green' : 'red'}; // 온도계 상태에 따라 색상 변경
`


// 온도 제어 섹션 스타일링
const ControlContainer = styled.div`
  display: flex;
  justify-content: space-around;
  margin-bottom: 80px;
`;

const InputContainer = styled.div`
  display: flex;
  flex-direction: column; // 세로 방향으로 요소 배치
  align-items: center;
  margin: 30px 50px 10px 30px;
`;

const InputContents = styled.div`
    margin-top: 20px;
    
`

const Input = styled.input`
  font-size: 16px;
  padding: 5px;
  margin-right: 15px; // 레이블과 입력창 사이 간격 조절
  width: 100px; // 입력 필드 너비 조절
`;

const Button = styled.button`
  font-size: 16px;
  padding: 5px 10px;
  color: white;
  background-color: #007bff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  &:hover {
    background-color: #0056b3;
  }
`;

// 토글 스위치 컴포넌트 스타일링
const ToggleSwitch = styled.label`
  position: relative;
  display: inline-block;
  margin-top:20px;
  width: 60px;
  height: 34px;
`;

const Slider = styled.span`
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: .4s;
  border-radius: 34px;
  
  &:before {
    position: absolute;
    content: "";
    height: 26px;
    width: 26px;
    left: 4px;
    bottom: 4px;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
`;

const Checkbox = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  
  &:checked + ${Slider} {
    background-color: #2196F3;
  }
  
  &:focus + ${Slider} {
    box-shadow: 0 0 1px #2196F3;
  }
  
  &:checked + ${Slider}:before {
    transform: translateX(26px);
  }
`;