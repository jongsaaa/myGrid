class grid2 {
    constructor() {
        this.target = undefined;
        this.data = [];
        this.column = [];
        this.defaultValue;
        this.filteredData = [];
        this.color = '#c1c9f7';

        this.sigleClick = function () {};
        this.dblClick = function () {};

        this.filter = [];
        this.sequence;
    }

    init(
        tableTarget,
        setting = {
            //데이터 없을 때, 메세지
            emptyMessage: (emptyMessage = '데이터가 없습니다.'),
            //데이터
            data: (data = [{}]),
            //컬럼
            column: (column = []),
            //값 없을 때, 메세지
            defaultValue: (defaultValue = ''),
            sequence: (sequence = 'no'),
            sigleClick: (sigleClick = function () {}),
            dblClick: (dblClick = function () {}),
            color: (color = '#c1c9f7'),
        }
    ) {
        this.emptyMessage = setting.emptyMessage;
        this.column = setting.column;
        this.data = setting.data;
        this.target = tableTarget;
        this.defaultValue = setting.defaultValue;
        this.sequence = setting.sequence;
        if (setting.color) this.color = setting.color;

        this.#set(this.data, this.sigleClick, this.dblClick);
    }

    reload(data) {
        // debugger;
        this.data = data;
        this.#set(this.data, this.sigleClick, this.dblClick);
    }

    search(condition, searchValue) {
        let newFilter = []; // 새로운 필터 조건을 저장할 배열
        if (this.filter.length > 0) {
            let be = false; // 조건이 존재하는지 추적하는 변수
            for (let i = 0; i < this.filter.length; i++) {
                if (this.filter[i].condition == condition) {
                    if (searchValue != '') {
                        // 검색 값이 비어있지 않은 경우에만 조건을 업데이트하여 추가
                        this.filter[i].searchValue = searchValue;
                        newFilter.push(this.filter[i]);
                    }
                    be = true; // 일치하는 조건이 발견되었음
                } else {
                    // 일치하지 않는 경우, 기존 조건을 그대로 추가
                    if (this.filter[i].searchValue != '') newFilter.push(this.filter[i]);
                }
            }

            if (!be && searchValue != '') {
                // '아예 없을 때'이고, 검색 값이 비어있지 않은 경우에만 새 조건을 추가
                newFilter.push({
                    condition: condition,
                    searchValue: searchValue,
                });
            }
        }
        //처음에 조건 넣기
        else {
            if (searchValue != '') {
                newFilter.push({
                    condition: condition,
                    searchValue: searchValue,
                });
            }
        }
        // 새로운 필터 배열을 사용하도록 업데이트
        this.filter = newFilter;

        //loading 시작
        loading.open();
        let copyData = JSON.parse(JSON.stringify(this.data));

        //새로운 sequence 설정 및 데이터 세팅
        for (let i = 0; i < this.filter.length; i++) {
            let index = 1;
            let filteredData = [];

            //여러 조건들로 교집합 데이터 산출
            for (let j = 0; j < copyData.length; j++) {
                if (copyData[j][this.filter[i].condition].includes(this.filter[i].searchValue)) {
                    copyData[j][this.sequence] = index;
                    filteredData.push(copyData[j]);
                    index++;
                }
            }
            copyData = filteredData;
        }

        //나중에 화면에서 보는 내용을 다운로드 하기 위한 기능
        this.filteredData = copyData;

        //loading을 활용하기 위해 setTimeout으로 비동기 구현
        setTimeout(() => {
            this.#set(this.filteredData);
            loading.close();
        }, 100);
    }

    #set(data, sigleClick, dblClick) {
        //해당 row에대한 세팅
        let tbody = this.target.querySelector('tbody');
        tbody.innerHTML = '';

        //데이터 없을 때, emptyMessage 세팅
        if (!data || data.length == 0) {
            let row = document.createElement('tr');
            row.innerHTML = '<td colSpan="' + this.column.length + '">' + this.emptyMessage + '</td>';
            tbody.appendChild(row);
            return;
        }

        //데이터가 있을 때,
        for (let i = 0; i < data.length; i++) {
            let row = document.createElement('tr');
            for (let j = 0; j < this.column.length; j++) {
                let td = document.createElement('td');
                if (this.column[j].dataHandler && typeof this.column[j].dataHandler == 'function') {
                    data[i][this.column[j].name] = this.column[j].dataHandler(this.column[j].dataHandler(data[i][this.column[j].name], data[i], data)) || data[i][this.column[j].name];
                }
                td.innerHTML = data[i][this.column[j].name] || this.defaultValue;
                row.appendChild(td);
            }

            //tbody에 row 추가
            tbody.appendChild(row);

            //해당 row에 대한 클릭 이벤트
            let oneClick; //더블 클릭과 분리하기 위한 조건
            let color = this.color;
            row.style.cursor = 'pointer';
            row.addEventListener('click', function () {
                if (oneClick) return;
                oneClick = true;

                //모든 tr에 대해서 체크
                let trs = tbody.querySelectorAll('tr');
                let tds;
                for (let j = 0; j < trs.length; j++) {
                    let tr = trs[j];
                    tds = tr.querySelectorAll('td');

                    //해당 tr의 tds에 대해서 배경값 설정
                    for (let k = 0; k < tds.length; k++) {
                        let td = tds[k];
                        if (tr == this) {
                            //선택된 row에 색상이 들어있는 경우,
                            if (td.style.backgroundColor) {
                                oneClick = false;
                                td.style.backgroundColor = '';
                            }
                            //선택된 row의 경우, 색 변경
                            else td.style.backgroundColor = color;
                        }
                        //현재 선택된 row가 아닌 경우, 모든 td의 색 무색으로 변경
                        else {
                            td.style.backgroundColor = '';
                        }
                    }
                }

                //sigleClick시 이벤트
                if (sigleClick && typeof sigleClick == 'function') {
                    sigleClick(data[i], tds);
                }

                if (!oneClick) return;
                setTimeout(() => {
                    oneClick = false;
                }, 500);
            });

            //dblClick시 이벤트
            if (dblClick && typeof dblClick == 'function') {
                row.addEventListener('dblclick', function (event) {
                    event.stopPropagation();
                    let tds = document.querySelector('td');

                    dblClick(data[i], tds);
                });
            }
        }
    }
}
