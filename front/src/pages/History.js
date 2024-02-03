import React, { useState } from 'react';
import styled from 'styled-components';
import { readTemperatureHistory } from '../services/api';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import moment from 'moment-timezone';
import { Line } from 'react-chartjs-2';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import 'chartjs-adapter-moment';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faFileCsv,
    faImage
} from "@fortawesome/free-solid-svg-icons";

const History = () => {
    const [startDateTime, setStartDateTime] = useState('');
    const [endDateTime, setEndDateTime] = useState('');
    const [temperatureData, setTemperatureData] = useState([]);
    const [interval, setInterval] = useState('60'); // 데이터 포인트 간격 (초 단위, 기본값 1분)
    const [verify, setVerify] = useState(false); // 데이터 조회 여부 검사
    const [maxTemperature, setMaxTemperature] = useState(null);
    const [minTemperature, setMinTemperature] = useState(null);
    const [averageTemperature, setAverageTemperature] = useState(null);

    // 데이터 간격 선택 핸들러
    const handleIntervalChange = (e) => {
        setInterval(e.target.value);
    };

    const handleSearch = async () => {
        try {
            const response = await readTemperatureHistory(startDateTime, endDateTime, interval);

            // 시작 시간과 종료 시간 사이를 간격별로 나누어 시간대 생성
            let currentTime = moment(startDateTime);
            const endTime = moment(endDateTime);
            const chartLabels = [];
            const chartData = new Array(Math.ceil(endTime.diff(currentTime, 'seconds') / interval)).fill(null);

            // 가장 가까운 데이터 포인트 찾기
            response.data.forEach(dataPoint => {
                const dataTime = moment(dataPoint.timestamp); // 데이터베이스에서 가져온 각 온도 데이터의 시간
                const closestIndex = Math.round(dataTime.diff(currentTime, 'seconds') / interval);
                if (!chartData[closestIndex] || Math.abs(chartData[closestIndex].time.diff(dataTime)) > Math.abs(dataTime.diff(currentTime.clone().add(interval * closestIndex, 'seconds')))) {
                    chartData[closestIndex] = { temperature: dataPoint.temperature, time: dataTime };
                }
            });

            calculateTemperatureStats(chartData);

            // 차트 데이터 설정
            chartData.forEach((data, index) => {
                chartLabels.push(currentTime.clone().add(interval * index, 'seconds').toDate());
                chartData[index] = data ? data.temperature : null;
            });

            setTemperatureData({ labels: chartLabels, data: chartData });
            

            setVerify(true);
        } catch (error) {
            console.error('Error fetching temperature history:', error);
            setVerify(false);
        }
    };

    const calculateTemperatureStats = (data) => {
        const validData = data.filter((dataPoint) => dataPoint !== null && dataPoint.temperature !== null).map(dataPoint => dataPoint.temperature);
        console.log(validData);
        if (validData.length > 0) {
            const max = Math.max(...validData);
            const min = Math.min(...validData);
            const average = validData.reduce((acc, curr) => acc + curr, 0) / validData.length;

            console.log(max);
            console.log(min);
            console.log(average);

            setMaxTemperature(max);
            setMinTemperature(min);
            setAverageTemperature(average.toFixed(2)); // 소수점 두 자리까지
        } else {
            setMaxTemperature(null);
            setMinTemperature(null);
            setAverageTemperature(null);
        }
    };

    // 조회 시작 시간과 종료 시간을 기반으로 적절한 time unit과 stepSize를 결정하는 함수
    function getTimeScaleOptions(startDateTime, endDateTime) {
        const duration = moment(endDateTime).diff(moment(startDateTime), 'hours');
        let unit = 'minute';
        let stepSize = 1;
        let displayFormat = 'YYYY-MM-DD HH:mm';

        if (duration <= 24) { // 24시간 이하
            unit = 'minute';
            stepSize = 30; // 30분 간격
        } else if (duration <= 72) { // 3일 이하
            unit = 'hour';
            stepSize = 1; // 1시간 간격
        } else { // 3일 이상
            unit = 'day';
            stepSize = 1; // 1일 간격
            displayFormat = 'YYYY-MM-DD';
        }

        return {
            unit: unit,
            stepSize: stepSize,
            tooltipFormat: 'YYYY-MM-DD HH:mm:ss',
            displayFormats: {
                [unit]: displayFormat
            },
        };
    }



    // 차트 데이터 설정
    const lineChartData = {
        labels: temperatureData.labels,
        datasets: [{
            label: '온도',
            data: temperatureData.data,
            fill: false,
            borderColor: 'rgb(75, 192, 192)',
            tension: 0.1
        }]
    };

    const chartOptions = {
        scales: {
            x: {
                type: 'time',
                time: getTimeScaleOptions(startDateTime, endDateTime),
                title: {
                    display: true,
                    text: 'Time',
                },
            },
            y: {
                beginAtZero: true,
            },
        },
    };
    

    // 조회 시작 시간, 끝 시간에 따른 처리
    const handleTimeChange = (value, type) => {
        if (value) {
            let timeString = value + ':00'; // 선택된 시간에 초를 00초로 추가
            let currentDateTime = type === 'start' ? startDateTime : endDateTime;
            currentDateTime = currentDateTime ? moment(currentDateTime) : moment();
    
            let [hours, minutes] = timeString.split(':');
            currentDateTime.tz('Asia/Seoul').set({ hour: parseInt(hours), minute: parseInt(minutes) });
    
            let isoString = currentDateTime.format();
            type === 'start' ? setStartDateTime(isoString) : setEndDateTime(isoString);
        }
    };
    
    // 조회 시작 날짜, 끝 날짜에 따른 처리
    const handleDateChange = (value, type) => {
        if (value) {
            let date = moment(value);
            let currentDateTime = type === 'start' ? startDateTime : endDateTime;
            currentDateTime = currentDateTime ? moment(currentDateTime) : moment();
    
            date.tz('Asia/Seoul').set({ year: date.year(), month: date.month(), date: date.date() });
    
            let isoString = date.format();
            type === 'start' ? setStartDateTime(isoString) : setEndDateTime(isoString);
        }
    };

    // 데이터를 CSV 형식으로 변환하는 함수
    const convertToCSV = (data) => {
        // CSV 파일의 헤더
        let csvContent = "날짜,시간,온도\n";

        // 각 데이터 포인트를 새 줄에 추가
        data.forEach(item => {
            const date = moment(item.timestamp).format('YYYY-MM-DD');
            const time = moment(item.timestamp).format('HH:mm:ss');
            csvContent += `${date},${time},${item.temperature}\n`;
        });

        return csvContent;
    };

    // 데이터를 CSV 파일로 저장하는 함수
    const handleSaveDataAsCSV = () => {
        if (!verify) {
            alert("먼저 데이터를 조회해주세요.");
            return;
        }
        saveDataAsCSV(temperatureData.data.map((temp, index) => ({
            timestamp: temperatureData.labels[index],
            temperature: temp
        })));
    };

    
    // CSV 파일로 저장하는 함수
    const saveDataAsCSV = (data) => {
        const BOM = '\uFEFF'; // 한글 입력시 깨짐 방지

        const csvContent = convertToCSV(data);
        const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
        saveAs(blob, "temperature-data.csv");
    };

    // 그래프를 이미지로 저장하는 함수
    const handleCaptureGraph = () => {
        if (!verify) {
            alert("먼저 데이터를 조회해주세요.");
            return;
        }
        captureGraph();
    }

    // 그래프 캡쳐
    const captureGraph = () => {
        const graphElement = document.getElementById('graph-container'); // 그래프가 포함된 컨테이너의 ID
        html2canvas(graphElement).then(canvas => {
          canvas.toBlob(function(blob) {
            saveAs(blob, "graph-capture.png");
          });
        });
      };

    return (
        <div>
            <Header></Header>
            <Body>
                <Sidebar></Sidebar>
                <Contents>
                    <Title>온도 로그</Title>
                        <Top>
                        <SearchArea>
                            <DateInput
                                type="date"
                                value={startDateTime ? startDateTime.split('T')[0] : ""}
                                onChange={(e) => handleDateChange(e.target.value, 'start')}
                            />
                            <TimeInput
                                type="time"
                                value={startDateTime ? startDateTime.split('T')[1].substring(0, 5) : ""}
                                onChange={(e) => handleTimeChange(e.target.value, 'start')}
                            />
                            <DateInput
                                type="date"
                                value={endDateTime ? endDateTime.split('T')[0] : ""}
                                onChange={(e) => handleDateChange(e.target.value, 'end')}
                            />
                            <TimeInput
                                type="time"
                                value={endDateTime ? endDateTime.split('T')[1].substring(0, 5): ""}
                                onChange={(e) => handleTimeChange(e.target.value, 'end')}
                            />
                            <DurationSelect value={interval} onChange={handleIntervalChange}>
                                <option value="60">1분</option>
                                <option value="600">10분</option>
                                <option value="1800">30분</option>
                                <option value="3600">1시간</option>
                            </DurationSelect>
                            <SearchButton onClick={handleSearch}>조회</SearchButton>

                        </SearchArea>
                        <Save>
                            <SaveDataButton onClick={handleSaveDataAsCSV}><FontAwesomeIcon icon={faFileCsv} size="2x" color={"#28a745"}/></SaveDataButton>
                            <CaptureGraphButton onClick={handleCaptureGraph}><FontAwesomeIcon icon={faImage} size="2x" color={"#17a2b8"}/></CaptureGraphButton>
                        </Save>
                    </Top>
                    <ChartArea id="graph-container">
                        <Line data={lineChartData} options={chartOptions}/>
                    </ChartArea>
                    <Title>데이터 분석</Title>
                    <DataContainer>
                        <DataItem>
                            <Label>최댓값</Label>
                            <Value>{maxTemperature ? `${maxTemperature}°C` : 'N/A'}</Value>
                        </DataItem>
                        <DataItem>
                            <Label>최솟값</Label>
                            <Value>{minTemperature ? `${minTemperature}°C` : 'N/A'}</Value>
                        </DataItem>
                        <DataItem>
                            <Label>평균값</Label>
                            <Value>{averageTemperature ? `${averageTemperature}°C` : 'N/A'}</Value>
                        </DataItem>
                    </DataContainer>
                </Contents>
            </Body>
        </div>
    );
};

export default History;

// Styled Components
const Title = styled.h1`
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 20px;
`;

const Top = styled.div`
    display: flex;
    justify-content: space-between;
    margin: 5px 100px 20px 20px;
`;

const Body = styled.div`
    display: flex;
    width: 100%;
`;

const Contents = styled.div`
    flex-grow: 1;
    padding: 20px;
`;

const SearchArea = styled.div`
    display: flex;
    align-items: center;
`;

const DateInput = styled.input`
    margin-right: 10px;
`;

const TimeInput = styled.input`
    margin-right: 10px;
`;

const DurationSelect = styled.select`
    margin-right: 10px;
    padding: 5px 10px;
    border: 1px solid #ccc;
    border-radius: 5px;
    cursor: pointer;
`;

const SearchButton = styled.button`
    padding: 5px 15px;
    background-color: #007bff;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
        background-color: #0056b3;
    }
`;

const Save = styled.div`

`;

const SaveDataButton = styled.button`
    background-color: white;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
        
    }
`;

const CaptureGraphButton = styled.button`
    margin-left: 10px; // 버튼 사이의 간격
    background-color: white;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;

    &:hover {
        
    }
`;

const ChartArea = styled.div`
    // Add styling for chart area if needed
`;

const DataContainer = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-bottom: 20px;
`;

const DataItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px;
`;

const Label = styled.span`
  font-size: 18px;
  font-weight: bold;
  color: #666;
`;

const Value = styled.span`
  margin-top: 10px;
  font-size: 18px;
  font-weight: bold;
  color: #333;
`;