

const colors = {
    '2': '#000000', '3': '#0000ff', '4': '#ff0000', '5': '#00ff00', 
    '6': '#ffff00', '7': '#800080', '8': '#ffa500', 'center': '#00ffff'
};
let pointsByColor = {}; 
let hiddenColors = {}; 


function getIntersection(p1, p2, p3, p4) {
    const [x1, y1] = p1; const [x2, y2] = p2; const [x3, y3] = p3; const [x4, y4] = p4;
    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (denom === 0) return null;
    const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
    const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom;
    if (t > 0.00001 && t < 0.99999 && u > 0.00001 && u < 0.99999) {
        const intersectX = x1 + t * (x2 - x1);
        const intersectY = y1 + t * (y2 - y1);
        return `${parseFloat(intersectX.toFixed(5))},${parseFloat(intersectY.toFixed(5))}`;
    }
    return null;
}

function getVertices(n, radius) {
    const points = [];
    const centerAngle = (2 * Math.PI) / n;
    const startAngle = Math.PI / 2;
    for (let i = 0; i < n; i++) {
        const angle = startAngle + i * centerAngle;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        points.push([x, y]);
    }
    return points;
}

function updateLegend(countsByOverlap) {
    const legendItemsDiv = document.getElementById('legendItems');
    legendItemsDiv.innerHTML = '';
    const order = ['2', '3', '4', '5', '6', '7', '8', 'center'];

    order.forEach(overlapKey => {
        if (countsByOverlap[overlapKey] && countsByOverlap[overlapKey] > 0) {
            const color = colors[overlapKey];
            const count = countsByOverlap[overlapKey];
            const item = document.createElement('div');
            item.className = 'legend-item';
            const colorBox = document.createElement('div');
            colorBox.className = 'color-box';
            colorBox.style.backgroundColor = color;
            colorBox.dataset.colorKey = overlapKey; 
            colorBox.addEventListener('click', (e) => {
                e.stopPropagation();
                togglePointsVisibility(overlapKey, colorBox);
            });
            const textNode = document.createElement('span');
            textNode.textContent = `${overlapKey === 'center' ? '중심점' : overlapKey + '개 겹침'}: ${count}개`;
            item.appendChild(colorBox);
            item.appendChild(textNode);
            legendItemsDiv.appendChild(item);
        }
    });
}

function togglePointsVisibility(colorKey, colorBoxElement) {
    if (hiddenColors[colorKey]) {
        hiddenColors[colorKey] = false; 
        colorBoxElement.classList.remove('hidden');
    } else {
        hiddenColors[colorKey] = true; 
        colorBoxElement.classList.add('hidden');
    }
    redrawCanvas();
}

function redrawCanvas() {
    const canvas = document.getElementById('polygonCanvas');
    const ctx = canvas.getContext('2d');
    const size = canvas.width;
    const center = size / 2;
    ctx.clearRect(0, 0, size, size);

    ctx.save();
    ctx.translate(center, center);
    ctx.scale(1, -1); 
    
    // 외곽선 및 대각선 그리기
    const n = document.getElementById('sidesInput').value;
    const radius = document.getElementById('radiusInput').value;
    const points = getVertices(n, radius);
    const diagonals = [];
     for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (j !== i + 1 && !(i === 0 && j === n - 1 && n > 2)) {
                diagonals.push([points[i], points[j], i, j]);
            }
        }
    }

    ctx.strokeStyle = '#cccccc'; ctx.lineWidth = 0.5;
    for (const [p1, p2] of diagonals) { 
        ctx.beginPath();
        ctx.moveTo(p1[0], p1[1]); // 좌표 인덱스 추가
        ctx.lineTo(p2[0], p2[1]); // 좌표 인덱스 추가
        ctx.stroke();
    }
    
    ctx.strokeStyle = '#000000'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]); // 좌표 인덱스 추가
    for (let i = 1; i < n; i++) {
        ctx.lineTo(points[i][0], points[i][1]); // 좌표 인덱스 추가
    }
    ctx.closePath();
    ctx.stroke();


    // 교점 그리기 (숨겨진 색상은 건너뛰기)
    Object.keys(pointsByColor).forEach(colorKey => {
        if (!hiddenColors[colorKey]) { 
            ctx.fillStyle = colors[colorKey];
            pointsByColor[colorKey].forEach(([x, y]) => {
                ctx.beginPath();
                ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
                ctx.fill();
            });
        }
    });

    // 꼭짓점 그리기
    ctx.fillStyle = '#000000'; 
    for (const p of points) {
        ctx.beginPath();
        ctx.arc(p[0], p[1], 4, 0, 2 * Math.PI); // 좌표 인덱스 추가
        ctx.fill();
    }

    ctx.restore(); 
}


function calculateAndPrepareData(n, radius) {
    pointsByColor = {};
    hiddenColors = {};

    const points = getVertices(n, radius);
    const diagonals = [];
    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            if (j !== i + 1 && !(i === 0 && j === n - 1 && n > 2)) {
                diagonals.push([points[i], points[j], i, j]);
            }
        }
    }
    const intersectionCoordsCount = {};
    for (let i = 0; i < diagonals.length; i++) {
        for (let j = i + 1; j < diagonals.length; j++) {
            const [p1, p2, i1, i2] = diagonals[i];
            const [p3, p4, i3, i4] = diagonals[j];
            if (i1 !== i3 && i1 !== i4 && i2 !== i3 && i2 !== i4) {
                const intersectStr = getIntersection(p1, p2, p3, p4);
                if (intersectStr) {
                    if (intersectionCoordsCount[intersectStr]) {
                        intersectionCoordsCount[intersectStr]++;
                    } else {
                        intersectionCoordsCount[intersectStr] = 1;
                    }
                }
            }
        }
    }
    const countsByOverlap = {'2': 0, '3': 0, '4': 0, '5': 0, '6': 0, '7': 0, '8': 0, 'center': 0};
    Object.keys(intersectionCoordsCount).forEach(coordStr => {
        const [x, y] = coordStr.split(',').map(Number);
        let colorKey;
        if (Math.abs(x) < 0.001 && Math.abs(y) < 0.001) {
            colorKey = 'center';
        } else {
            const overlapCount = intersectionCoordsCount[coordStr] > 1 ? (Math.sqrt(1 + 8 * intersectionCoordsCount[coordStr]) + 1) / 2 : 2;
            colorKey = Math.round(overlapCount).toString();
        }
        if (!pointsByColor[colorKey]) pointsByColor[colorKey] = [];
        pointsByColor[colorKey].push([x, y]);
        countsByOverlap[colorKey]++;
    });
    
    updateLegend(countsByOverlap);
    const totalIntersections = Object.keys(intersectionCoordsCount).length;
    return totalIntersections;
}


// 이벤트 핸들러
document.getElementById('calculateButton').addEventListener('click', () => {
    const sidesInput = document.getElementById('sidesInput').value;
    const radiusInput = document.getElementById('radiusInput').value;
    const n = parseInt(sidesInput);
    const r = parseInt(radiusInput);
    if (n >= 3 && n <= 60 && r >= 50 && r <= 380) {
        const totalIntersections = calculateAndPrepareData(n, r); 
        redrawCanvas();
        document.getElementById('resultDisplay').textContent = 
            `정${n}각형의 실제 교점 개수는 총 ${totalIntersections}개 입니다.`;
    } else {
        document.getElementById('resultDisplay').textContent = '입력 범위를 확인해주세요: 변의 수(3~60), 크기(50~380)';
    }
});

