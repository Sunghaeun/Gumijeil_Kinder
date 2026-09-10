/* 구미제일교회 유치부 반별명단 - 데이터 정의 및 상태 관리 */
/* SEED_DATA는 원본 파일에서 그대로 추출한 초기 데이터입니다 (최초 1회, DB가 비어있을 때만 사용) */
const SEED_DATA = {
  "title": "구미제일교회 유치부 반별명단",
  "updated": "2026.08.03",
  "footnote": "총재적=재적인원+별명부포함인원   1. 6개월 결석시 → 별명부로 이적   2. 별명부 이적 후 6개월 결석시 → 제명 처리함.",
  "summary": "총60명(재적55+별명부5)",
  "ageGroups": [
    {
      "age": "5세",
      "pastor": "임하은",
      "label": "22명",
      "classes": [
        {
          "name": "믿음반",
          "teachers": [
            "박은혜"
          ],
          "members": [
            {
              "name": "구예주",
              "dob": "22.03.10",
              "gender": "여",
              "phone": "010-2822-2935",
              "address": "고아읍 평성로 9길 7-12 원호자이더포레 106동1102호",
              "note": "구병욱/김시온"
            },
            {
              "name": "구은효",
              "dob": "22.03.10",
              "gender": "남",
              "phone": "010-2822-2935",
              "address": "고아읍 평성로 9길 7-12 원호자이더포레 106동1102호",
              "note": "구병욱/김시온"
            },
            {
              "name": "김하준",
              "dob": "22.01.27",
              "gender": "남",
              "phone": "010-8854-1401",
              "address": "구미시 남통동 이편한세상",
              "note": "김봉일/최은진"
            },
            {
              "name": "에르헴",
              "dob": "22.04.01",
              "gender": "남",
              "phone": "010-5685-2535",
              "address": "샬롬아파트 204호",
              "note": "사롤/서더"
            },
            {
              "name": "앙힐",
              "dob": "22.09.19",
              "gender": "여",
              "phone": "010-84581583",
              "address": "구미시 원평동",
              "note": "게렐차머"
            }
          ]
        },
        {
          "name": "소망반",
          "teachers": [
            "심옥섭",
            "최다정"
          ],
          "members": [
            {
              "name": "김리온",
              "dob": "22.10.17",
              "gender": "남",
              "phone": "010-5515-1025",
              "address": "중흥 에스-클래스에코시티",
              "note": "김혁주/양하은"
            },
            {
              "name": "김유하",
              "dob": "22.08.10",
              "gender": "여",
              "phone": "010-8285-6835",
              "address": "옥계북로 69",
              "note": "김건우/조효원"
            },
            {
              "name": "김호세",
              "dob": "22.12.18",
              "gender": "남",
              "phone": "010-2933-3394",
              "address": "구미대로 186-20 104동 205호",
              "note": "김영배/최성경"
            },
            {
              "name": "양이준",
              "dob": "22.06.25",
              "gender": "남",
              "phone": "010-8497-1897",
              "address": "쌍용예가",
              "note": "양재홍/황별희"
            },
            {
              "name": "유지은",
              "dob": "22.04.23",
              "gender": "여",
              "phone": "010-3263-3430",
              "address": "산동읍 신당3로 15 골드디움",
              "note": "이은영"
            }
          ]
        },
        {
          "name": "사랑반",
          "teachers": [
            "신미애",
            "이건우"
          ],
          "members": [
            {
              "name": "정시아",
              "dob": "22.11.18",
              "gender": "여",
              "phone": "010-9578-2187",
              "address": "산호대로 39길25 이편한@ 108동 2102호",
              "note": "김보배/정시우"
            },
            {
              "name": "정태후",
              "dob": "22.10.18",
              "gender": "남",
              "phone": "010-9333-2899",
              "address": "중흥 에듀포레",
              "note": "정성재/김지안"
            },
            {
              "name": "이아율",
              "dob": "22.11.18",
              "gender": "여",
              "phone": "010.4521.6808",
              "address": "구미대로 186-20 104/406 광평 푸르지오",
              "note": ""
            },
            {
              "name": "최하온",
              "dob": "22.09.23",
              "gender": "남",
              "phone": "010-5757-1897",
              "address": "신당인덕 3로 16, 3006동 1703호",
              "note": "최정열/정연지"
            },
            {
              "name": "정채원",
              "dob": "22.08.08",
              "gender": "여",
              "phone": "010-6315-2441",
              "address": "우미린 5차 센트럴파트 115동 1204호",
              "note": "26.03.22"
            },
            {
              "name": "이사랑",
              "dob": "22.07.26",
              "gender": "여",
              "phone": "010-8542-2123",
              "address": "에코씨티 1007동 601호",
              "note": ""
            }
          ]
        },
        {
          "name": "지혜반",
          "teachers": [
            "장채은",
            "남인"
          ],
          "members": [
            {
              "name": "김선호",
              "dob": "22.08.24",
              "gender": "남",
              "phone": "010-9068-5789",
              "address": "해마루공원로80",
              "note": "김기백/오지헌"
            },
            {
              "name": "김은찬",
              "dob": "22.09.08",
              "gender": "남",
              "phone": "010-2372-6851",
              "address": "호반베르디움 112동 504호",
              "note": "김보성/김신혜"
            },
            {
              "name": "신서우",
              "dob": "22.03.08",
              "gender": "남",
              "phone": "010-8365-0020",
              "address": "산호대로925 옥계우미린스카이",
              "note": "신광휴/박지은B"
            },
            {
              "name": "강해리",
              "dob": "22.10.11",
              "gender": "남",
              "phone": "010-8818-8216",
              "address": "공단동 1공단로9길 30-12 파라디아",
              "note": "조미령"
            }
          ]
        },
        {
          "name": "충성반",
          "teachers": [
            "박동주"
          ],
          "members": [
            {
              "name": "배시우",
              "dob": "22.11.24",
              "gender": "남",
              "phone": "010-9911-7925",
              "address": "구미 우미5차",
              "note": "배창규/김은혜"
            },
            {
              "name": "서해나",
              "dob": "22.12.05",
              "gender": "여",
              "phone": "010-8831-8513",
              "address": "골드클래스",
              "note": "홍은영/서민우"
            },
            {
              "name": "박로이",
              "dob": "22.09.22",
              "gender": "남",
              "phone": "010-6553-0596",
              "address": "옥계동 이편한 세상",
              "note": "박노아/주은경"
            },
            {
              "name": "하이르",
              "dob": "22.12.24",
              "gender": "여",
              "phone": "010-5784-7335",
              "address": "구미시 임수로 76",
              "note": "강게렐"
            }
          ]
        }
      ]
    },
    {
      "age": "6세",
      "pastor": "",
      "label": "15명",
      "classes": [
        {
          "name": "온유반",
          "teachers": [
            "안대호"
          ],
          "members": [
            {
              "name": "김강민",
              "dob": "21.09.16",
              "gender": "남",
              "phone": "010-2810-1238",
              "address": "왕산로 28-13 코오롱하늘채",
              "note": "김명국/전정아"
            },
            {
              "name": "선호",
              "dob": "21.02.05",
              "gender": "남",
              "phone": "010-9825-1346",
              "address": "옥계북로 69 현진에버빌 105동 202호",
              "note": "선정우/조연지"
            },
            {
              "name": "이한규",
              "dob": "21.08.02",
              "gender": "남",
              "phone": "010-8765-8438",
              "address": "해마루공원로 80 중흥",
              "note": "이병준/남정희"
            },
            {
              "name": "황준서",
              "dob": "21.11.24",
              "gender": "남",
              "phone": "010-2870-3158",
              "address": "상모로 10길 40",
              "note": "황재원/황수민"
            },
            {
              "name": "하서준",
              "dob": "21.09.24",
              "gender": "남",
              "phone": "010-2302-8504",
              "address": "산호대로 925 우미린더스카이",
              "note": "하선찬/서유원"
            }
          ]
        },
        {
          "name": "자비반",
          "teachers": [
            "이수현"
          ],
          "members": [
            {
              "name": "김세온",
              "dob": "21.05.31",
              "gender": "여",
              "phone": "010-5515-1025",
              "address": "신당인덕1로 135 중흥2차 1014동 1603호",
              "note": "김혁주/양하은"
            },
            {
              "name": "허해솔",
              "dob": "21.09.17",
              "gender": "여",
              "phone": "010-2222-6070",
              "address": "해마루공원로111, 103/1404",
              "note": "25.09.21등록"
            },
            {
              "name": "장서우",
              "dob": "21.07.26",
              "gender": "여",
              "phone": "010-3977-2316",
              "address": "구미시 흥안로2길 14-35 101호",
              "note": "장대현/박선미"
            },
            {
              "name": "김지우",
              "dob": "21.10.20",
              "gender": "여",
              "phone": "010-9190-9829",
              "address": "중흥1차 103동 2703호",
              "note": "김진욱/이은경"
            }
          ]
        },
        {
          "name": "화평반",
          "teachers": [
            "김세훈"
          ],
          "members": [
            {
              "name": "이로운",
              "dob": "21.02.24",
              "gender": "남",
              "phone": "010-9493-9556",
              "address": "산동읍 우미린 센트럴파크 103동 1804",
              "note": "이재현/이사론"
            },
            {
              "name": "천세린",
              "dob": "21.02.16",
              "gender": "여",
              "phone": "010-2630-2447",
              "address": "대구 달성군 다사읍 서재로 7길 25(타지역)",
              "note": "천종환/전혜경"
            },
            {
              "name": "박가람",
              "dob": "21.08.28",
              "gender": "남",
              "phone": "010-6553-0596",
              "address": "옥계동 935, 이편한세상 107동 2002호",
              "note": "박노아선교사/주은경"
            },
            {
              "name": "이시온",
              "dob": "21.09.23",
              "gender": "남",
              "phone": "010-2848-1773",
              "address": "구미시 신당인덕3로 1 104-1701",
              "note": "이종승/정미나"
            }
          ]
        },
        {
          "name": "양선반",
          "teachers": [
            "곽상수"
          ],
          "members": [
            {
              "name": "남우진",
              "dob": "21.07.13",
              "gender": "남",
              "phone": "010-5886-4382",
              "address": "산동읍 우미린 센트럴파크",
              "note": "남재언/표나래"
            },
            {
              "name": "박로운",
              "dob": "21.09.01",
              "gender": "남",
              "phone": "010-9000-3987",
              "address": "산동읍 신당인덕3로1, 102동1103호",
              "note": "26.03.08등반"
            },
            {
              "name": "최지안",
              "dob": "21.02.04",
              "gender": "남",
              "phone": "010-8815-0175(아빠)",
              "address": "신당인덕1로 135, 1004동 901호",
              "note": ""
            }
          ]
        }
      ]
    },
    {
      "age": "7세",
      "pastor": "김정란",
      "label": "15명",
      "classes": [
        {
          "name": "승리반",
          "teachers": [
            "김규연"
          ],
          "members": [
            {
              "name": "박서우",
              "dob": "20.07.28",
              "gender": "남",
              "phone": "010-3185-4810",
              "address": "구미시 금오산로 6길12, 아이파크더샾 110동 302호",
              "note": "박영현/김서윤"
            },
            {
              "name": "김지찬",
              "dob": "20.09.01",
              "gender": "남",
              "phone": "010-3035-5928",
              "address": "검성로 103-21 화진금봉타운3차 301/1416",
              "note": "김태운/조하은"
            },
            {
              "name": "김하람",
              "dob": "20.04.23",
              "gender": "남",
              "phone": "010-2796-7060",
              "address": "구미시 신당3로 16 우미린센트럴 105-504",
              "note": "김용현/김미정"
            },
            {
              "name": "전하빈",
              "dob": "20.07.17",
              "gender": "남",
              "phone": "010-4388-1316",
              "address": "문성자이3차 106/1403",
              "note": "할머니"
            }
          ]
        },
        {
          "name": "감사반",
          "teachers": [
            "이종수",
            "양지훈"
          ],
          "members": [
            {
              "name": "오승원",
              "dob": "20.01.24",
              "gender": "남",
              "phone": "010-4843-1031",
              "address": "대구 달구벌대로 3280-1 203동 1104호",
              "note": "오도윤/조남조"
            },
            {
              "name": "안예준",
              "dob": "20.01.18",
              "gender": "남",
              "phone": "010-2651-1744",
              "address": "산동 골드클래스",
              "note": "안형섭/김민정A"
            },
            {
              "name": "구서준",
              "dob": "20.03.21",
              "gender": "남",
              "phone": "010-5436-5533",
              "address": "신당인덕1로 135 중흥S-에코시티 1009동505호",
              "note": "25.02.16"
            },
            {
              "name": "오승아",
              "dob": "20.01.24",
              "gender": "남",
              "phone": "010-4843-1031",
              "address": "대구 달구벌대로 3280-1 203동 1104호",
              "note": "오도윤/조남조"
            }
          ]
        },
        {
          "name": "희락반",
          "teachers": [
            "정유빈"
          ],
          "members": [
            {
              "name": "최예린",
              "dob": "20.03.03",
              "gender": "여",
              "phone": "010-4788-1182",
              "address": "거의 푸르지오엘리포레시티 2단지 209동 805호",
              "note": "최요한/배가람"
            },
            {
              "name": "임여화",
              "dob": "20.03.11",
              "gender": "여",
              "phone": "010-4080-0171",
              "address": "구평 부영 7단지 704동 503호",
              "note": "권해전"
            },
            {
              "name": "서채은",
              "dob": "20.08.19",
              "gender": "여",
              "phone": "010-4804-2002",
              "address": "신당인덕3로16 중흥s-클래스에듀포레 3016/1903",
              "note": "이은정"
            }
          ]
        },
        {
          "name": "진리반",
          "teachers": [
            "김사랑"
          ],
          "members": [
            {
              "name": "이다윤",
              "dob": "20.10.27",
              "gender": "여",
              "phone": "010-4821-1794",
              "address": "구미시 해마루공원로111, 우미린101동 303호",
              "note": "이상원/이소현"
            },
            {
              "name": "박세경",
              "dob": "20.07.14",
              "gender": "여",
              "phone": "010-8682-7531",
              "address": "구미시 신시로 133 203/403",
              "note": "박진수/황예지"
            },
            {
              "name": "오예나",
              "dob": "20.03.03",
              "gender": "여",
              "phone": "010-2308-1648",
              "address": "산동읍 신당인덕1로 135, 1008동 102호",
              "note": "오제호/유혜림"
            },
            {
              "name": "김하영",
              "dob": "20.04.21",
              "gender": "여",
              "phone": "010-8854-1401",
              "address": "아포읍 송천리 693-8, (금계2길 13-9)",
              "note": "김봉일/최은진"
            }
          ]
        }
      ]
    }
  ],
  "newClass": {
    "name": "신입반",
    "label": "10명",
    "members": [
      {
        "name": "박나은",
        "dob": "21.12.08",
        "gender": "여",
        "phone": "010-2803-0144",
        "address": "강변파라디아 104동 1204호",
        "note": "26.04.05"
      },
      {
        "name": "정연우",
        "dob": "22.02.16",
        "gender": "남",
        "phone": "010-9076-1108",
        "address": "산동읍 신당3로 43, 101-1504",
        "note": "26.05.03"
      },
      {
        "name": "김도윤",
        "dob": "21.10.28",
        "gender": "남",
        "phone": "010-3935-3053",
        "address": "",
        "note": "26.05.03"
      },
      {
        "name": "제서진",
        "dob": "21.03.14",
        "gender": "남",
        "phone": "010-6587-0730",
        "address": "",
        "note": "26.05.31"
      },
      {
        "name": "제서율",
        "dob": "21.03.14",
        "gender": "여",
        "phone": "010-6587-0730",
        "address": "",
        "note": "26.05.31"
      },
      {
        "name": "이바다",
        "dob": "",
        "gender": "여",
        "phone": "010-7726-0053",
        "address": "",
        "note": "26.05.31"
      },
      {
        "name": "이도현",
        "dob": "",
        "gender": "",
        "phone": "",
        "address": "",
        "note": "26.07.11"
      },
      {
        "name": "박제이",
        "dob": "20.12.01",
        "gender": "여",
        "phone": "010-2389-9341",
        "address": "중흥3차",
        "note": "26.07.12"
      },
      {
        "name": "박지호",
        "dob": "22.03.29",
        "gender": "남",
        "phone": "010-5285-6269",
        "address": "중흥3차",
        "note": "26.07.29"
      },
      {
        "name": "박시온",
        "dob": "21.03.26",
        "gender": "남",
        "phone": "010-4439-3689",
        "address": "중흥3차 3002-1405",
        "note": "26.08.02"
      }
    ]
  },
  "altList": {
    "name": "별명부",
    "label": "5명",
    "members": [
      {
        "name": "조아인",
        "dob": "21.07.15",
        "gender": "여",
        "phone": "010-5115-8250",
        "address": "도량동 도산 휴먼시아 102동602호",
        "note": "25.02.09등록"
      },
      {
        "name": "이서진",
        "dob": "22.04.07",
        "gender": "남",
        "phone": "010-8996-6469",
        "address": "봉곡 뜨란채",
        "note": "이희강/은단봉"
      },
      {
        "name": "장근히",
        "dob": "22.12.21",
        "gender": "여",
        "phone": "010-2365-0707",
        "address": "",
        "note": "장창익/반상애"
      },
      {
        "name": "황별",
        "dob": "20.06.24",
        "gender": "여",
        "phone": "010-2580-3242",
        "address": "중흥3차 3016동 603호",
        "note": "25.05.18등반"
      },
      {
        "name": "이예담",
        "dob": "20.02.11",
        "gender": "남",
        "phone": "010-3154-2178(모)",
        "address": "옥계북로33 105-1902",
        "note": ""
      }
    ]
  },
  "teachers": [
    {
      "name": "진지선",
      "dob": "74.01.17",
      "calType": "solar"
    },
    {
      "name": "이영용",
      "dob": "00.01.25",
      "calType": "solar"
    },
    {
      "name": "정유빈",
      "dob": "00.01.27",
      "calType": "solar"
    },
    {
      "name": "양지훈",
      "dob": "00.01.20",
      "calType": "solar"
    },
    {
      "name": "안대호",
      "dob": "88.02.02",
      "calType": "solar"
    },
    {
      "name": "김세훈",
      "dob": "00.02.25",
      "calType": "solar"
    },
    {
      "name": "김규연",
      "dob": "96.03.16",
      "calType": "solar"
    },
    {
      "name": "신미애",
      "dob": "79.01.23",
      "calType": "lunar"
    },
    {
      "name": "송치영",
      "dob": "00.04.20",
      "calType": "solar"
    },
    {
      "name": "이종수",
      "dob": "95.04.30",
      "calType": "solar"
    },
    {
      "name": "김사랑",
      "dob": "08.05.14",
      "calType": "solar"
    },
    {
      "name": "박동주",
      "dob": "83.05.21",
      "calType": "solar"
    },
    {
      "name": "김정란",
      "dob": "81.05.22",
      "calType": "solar"
    },
    {
      "name": "심옥섭",
      "dob": "73.05.21",
      "calType": "lunar"
    },
    {
      "name": "곽상수",
      "dob": "68.07.15",
      "calType": "solar"
    },
    {
      "name": "박은혜",
      "dob": "80.07.16",
      "calType": "solar"
    },
    {
      "name": "강혜원",
      "dob": "74.07.19",
      "calType": "solar"
    },
    {
      "name": "김영민",
      "dob": "05.07.23",
      "calType": "solar"
    },
    {
      "name": "장채은",
      "dob": "00.08.10",
      "calType": "solar"
    },
    {
      "name": "강승원",
      "dob": "00.09.21",
      "calType": "solar"
    },
    {
      "name": "이수현",
      "dob": "05.10.06",
      "calType": "solar"
    },
    {
      "name": "최다정",
      "dob": "00.10.17",
      "calType": "solar"
    },
    {
      "name": "도희찬",
      "dob": "01.10.20",
      "calType": "solar"
    },
    {
      "name": "이건우",
      "dob": "00.10.21",
      "calType": "solar"
    },
    {
      "name": "정연화",
      "dob": "69.09.14",
      "calType": "lunar"
    },
    {
      "name": "남인",
      "dob": "00.11.11",
      "calType": "solar"
    },
    {
      "name": "임하은",
      "dob": "00.12.12",
      "calType": "solar"
    }
  ]
};

/* ===== 상태 관리 (원본 로직은 그대로 유지하고, localStorage 대신 서버 API를 사용하도록 수정) ===== */

let state = null;
let editingMemberId = null;

/* ===== 연도별 반별명단 관리 =====
   반별명단(roster)과 선생님 명단(teachers)은 하나의 state 안에 함께 들어있으므로, 연도가
   바뀌면 이 둘을 통째로 "roster_2026" 같은 연도별 키로 나눠서 저장합니다. 출석부(attendance)는
   이 앱의 원래 범위대로 연도 구분 없이 그대로 하나만 유지합니다(사용자 확인 완료 사항).
   - roster_meta: { currentYear: 2026, years: [2022,2023,...,2026] } - 존재하는 연도 목록과
     "지금 편집 가능한(=최신) 연도"를 담습니다.
   - roster_<year>: 그 연도의 전체 state (예전 "roster" 키와 같은 모양).
   과거 연도(roster_meta.currentYear보다 작은 연도)는 화면에서 조회만 가능하고 수정은 막습니다. */

const LEGACY_ROSTER_KEY = "roster";
const YEAR_RETENTION_COUNT = 5; // 최근 5개 연도만 보관, 그보다 오래된 연도는 자동 파기

let metaState = null;   // { currentYear, years: [...] }
let viewYear = null;    // 지금 화면에 보여주고 있는 연도 (currentYear와 다르면 읽기 전용)

function rosterKeyForYear(year) { return `roster_${year}`; }
function isViewingCurrentYear() { return !!(metaState && viewYear === metaState.currentYear); }

/* 반/사람/선생님을 실제로 바꾸는 함수들 맨 앞에서 호출합니다. 과거 연도를 보는 중이면
   토스트로 안내하고 false를 반환합니다 (버튼은 CSS로도 숨기지만, 혹시 모를 경우를 대비한
   이중 방어). */
function guardEditable() {
  if (!isViewingCurrentYear()) {
    toast("⚠ 지난 연도 자료는 수정할 수 없습니다.");
    return false;
  }
  return true;
}

/* roster_meta를 불러옵니다. 아직 연도별 구조로 전환되지 않은(= 예전 "roster" 키만 있는)
   최초 실행 상태라면, 그 예전 데이터를 "올해" 연도의 데이터로 자동 이전하고 roster_meta를
   새로 만듭니다. (선생님 명단도 이 안에 함께 들어있으므로 같이 이전됩니다.) */
async function loadMeta() {
  let meta = null;
  try { meta = await apiGet("roster_meta"); } catch (e) { console.error("roster_meta 불러오기 실패", e); }

  if (meta && Array.isArray(meta.years) && meta.years.length) {
    // [버그 수정 후 1회성 보정] 예전 코드에 실수가 있어서, 연도별 구조를 도입한 뒤에도
    // saveState()가 실제로는 계속 예전 "roster" 키에만 저장되고 있었습니다(연도별 키가
    // 아니라). 그래서 그동안 실제로 수정한 최신 내용은 "roster"에 있고, "roster_<올해>"는
    // 오래된 상태로 남아있을 수 있습니다. 딱 한 번만 "roster"의 내용을 올해 데이터로
    // 덮어써서 최신 수정 내용을 살립니다(이후로는 이 보정을 다시 하지 않습니다 -
    // legacyReconciled 플래그로 표시).
    if (!meta.legacyReconciled) {
      let legacy = null;
      try { legacy = await apiGet(LEGACY_ROSTER_KEY); } catch (e) { console.error(e); }
      if (legacy) {
        try { await apiPut(rosterKeyForYear(meta.currentYear), legacy); }
        catch (e) { console.error("최근 수정 내용을 연도별 데이터로 옮기지 못했습니다.", e); }
      }
      meta.legacyReconciled = true;
      try { await apiPut("roster_meta", meta); } catch (e) { console.error(e); }
    }
    return meta;
  }

  const currentYear = new Date().getFullYear();
  let legacy = null;
  try { legacy = await apiGet(LEGACY_ROSTER_KEY); } catch (e) { console.error(e); }

  const newMeta = { currentYear, years: [currentYear], legacyReconciled: true };
  if (legacy) {
    try { await apiPut(rosterKeyForYear(currentYear), legacy); }
    catch (e) { console.error("예전 데이터를 연도별 데이터로 옮기지 못했습니다.", e); }
  }

  // 출석부도 예전에는 "attendance" 하나뿐이었으므로, 같은 방식으로 올해 데이터로 옮깁니다.
  // (사람 id가 연도마다 새로 매겨지기 때문에 출석부도 반드시 연도별로 나눠야 서로 안 섞입니다.)
  let legacyAtt = null;
  try { legacyAtt = await apiGet("attendance"); } catch (e) { console.error(e); }
  if (legacyAtt) {
    try { await apiPut(attendanceKeyForYear(currentYear), legacyAtt); }
    catch (e) { console.error("예전 출석부를 연도별 데이터로 옮기지 못했습니다.", e); }
  }

  try { await apiPut("roster_meta", newMeta); } catch (e) { console.error(e); }
  return newMeta;
}

/* [변경] localStorage.getItem 대신 서버(API)에서, 그것도 연도별 키에서 불러옵니다.
   서버에 저장된 데이터가 없으면(=완전히 새로운 연도) 최초 1회 SEED_DATA로 초기 상태를 만듭니다. */
async function loadState(year) {
  try {
    const remote = await apiGet(rosterKeyForYear(year));
    if (remote) return migrateState(remote);
  } catch (e) {
    console.error("불러오기 실패, 기본 데이터로 시작합니다.", e);
  }
  return buildInitialState(SEED_DATA);
}

/* [변경] localStorage.setItem 대신 서버(API)로, 연도별 키에 저장합니다. 지금 보고 있는 연도가
   "현재 연도"가 아니면(=과거 자료를 조회 중이면) 저장하지 않고 안내만 합니다. */
function saveState() {
  if (!state) return;
  if (!isViewingCurrentYear()) {
    toast("⚠ 지난 연도 자료는 수정할 수 없습니다.");
    return;
  }
  // 반/교사 명단이 바뀔 때마다, 이미 지난 출석 주차의 "그 당시 재적 인원수" 스냅샷은
  // 건드리지 않고 오늘 이후 주차만 최신 인원수로 갱신합니다 (js/attendance.js).
  if (typeof syncFutureWeekDenoms === "function") syncFutureWeekDenoms();
  apiPut(rosterKeyForYear(viewYear), state).catch(() => toast("⚠ 저장 실패 - 인터넷 연결을 확인하세요."));
}

/* 연도 선택 드롭다운에서 다른 연도를 선택했을 때 호출합니다. 반별명단뿐 아니라 출석부도
   그 연도 것으로 함께 바꿔줍니다(안 그러면 이전 연도 출석 체크가 남아서 뒤섞여 보입니다). */
async function switchYear(year) {
  year = parseInt(year, 10);
  if (isNaN(year) || year === viewYear) return;
  viewYear = year;
  state = await loadState(year);
  attState = await loadAttendance(year);
  render();
  renderYearSelector();
}

/* 5년 지난 연도 자료를 자동으로 파기합니다 (최근 5개 연도만 보관). */
async function purgeOldYears() {
  if (!metaState) return;
  const sorted = [...metaState.years].sort((a, b) => b - a);
  const keep = sorted.slice(0, YEAR_RETENTION_COUNT);
  const purge = sorted.slice(YEAR_RETENTION_COUNT);
  if (!purge.length) return;
  for (const y of purge) {
    try { await apiDelete(rosterKeyForYear(y)); } catch (e) { console.error("연도 자료 파기 실패", y, e); }
    try { await apiDelete(attendanceKeyForYear(y)); } catch (e) { console.error("연도 출석부 파기 실패", y, e); }
  }
  metaState.years = keep;
  try { await apiPut("roster_meta", metaState); } catch (e) { console.error(e); }
}

/* 한글파일 업로드로 새 연도의 반별명단을 확정 반영할 때 호출합니다.
   newState: buildInitialState()와 같은 모양의 완성된 state 객체.
   makeCurrent: true면 이 연도를 새로운 "현재(편집 가능) 연도"로 바꿉니다
   (미래 연도를 처음 업로드하는 경우). 이미 있는 과거 연도를 정정하는 업로드라면 false. */
async function saveYearData(year, newState, makeCurrent) {
  await apiPut(rosterKeyForYear(year), newState);
  if (!metaState.years.includes(year)) metaState.years.push(year);
  if (makeCurrent) metaState.currentYear = year;
  await apiPut("roster_meta", metaState);
  await purgeOldYears();
}

/* ===== [신규] 한글파일 업로드 없이 새 연도 시작하기 =====
   한글파일 업로드 파싱이 자꾸 불안정해서, 매년 반별명단을 그냥 손으로 다시 채우고 싶다는
   요청으로 추가한 기능입니다. 아래 규칙으로 "직전에 보고 있던 연도"의 자료를 바탕으로
   새 연도의 반별명단을 만듭니다.
   - 반 구조(연령대/반 이름/담당교사)는 그대로 복사하되, 그 반의 아이 명단은 비웁니다.
   - 정규반/신입반/별명부 가릴 것 없이 작년에 있던 아이 전원을 새 연도의 "별명부"로 모아
     둡니다. 관리자가 이미 있는 🔀(반 이동) 버튼으로 한 명씩 새 반으로 배정하면 되므로,
     이름/생년월일 등 정보를 다시 타이핑할 필요가 없습니다.
   - 선생님 명단은 그대로 이어받습니다 (보통 담당 교사는 해마다 크게 바뀌지 않으므로). */
function buildNewYearRosterFromPrevious(prevState) {
  const allMembers = [];
  (prevState.classes || []).forEach(c => {
    (c.members || []).forEach(m => {
      const { _fromClass, ...clean } = m;
      allMembers.push(clean);
    });
  });

  const classes = (prevState.classes || [])
    .filter(c => c.kind === "regular")
    .map(c => ({ ...c, members: [] }));

  const prevNew = (prevState.classes || []).find(c => c.kind === "new");
  classes.push({
    id: prevNew?.id || "c_new", kind: "new", pastor: prevNew?.pastor || "",
    name: prevNew?.name || "신입반", teachers: [...(prevNew?.teachers || [])], members: []
  });

  const prevAlt = (prevState.classes || []).find(c => c.kind === "alt");
  classes.push({
    id: prevAlt?.id || "c_alt", kind: "alt", pastor: prevAlt?.pastor || "",
    name: prevAlt?.name || "별명부", teachers: [...(prevAlt?.teachers || [])], members: allMembers
  });

  const teachers = (prevState.teachers || []).map(t => ({ ...t }));

  // 다음에 추가되는 신규 아이/교사의 id가 이어받은 기존 id와 겹치지 않도록, 이어받은 것들
  // 중 가장 큰 번호 다음부터 시작하게 계산합니다.
  const maxNum = (list, prefix) => list.reduce((mx, x) => {
    const n = parseInt(String(x.id || "").replace(prefix, ""), 10);
    return isNaN(n) ? mx : Math.max(mx, n);
  }, 0);

  return {
    title: prevState.title || "",
    updated: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
    footnote: prevState.footnote || "",
    summary: prevState.summary || "",
    classes,
    teachers,
    uidCounter: maxNum(allMembers, "m") + 1,
    teacherUidCounter: maxNum(teachers, "t") + 1
  };
}

/* 연도 선택 옆의 "🆕 새 연도 시작" 버튼에서 호출합니다. */
async function startNewYear() {
  if (!metaState || !state) return;
  const suggested = metaState.currentYear + 1;
  const input = prompt(`새로 시작할 연도를 입력하세요 (예: ${suggested})`, String(suggested));
  if (input === null) return;
  const year = parseInt(input.trim(), 10);
  if (isNaN(year) || year < 2000 || year > 2100) { alert("올바른 연도를 입력해주세요."); return; }

  const alreadyExists = metaState.years.includes(year);
  const msg = alreadyExists
    ? `${year}년 자료가 이미 있습니다.\n\n지금 보고 계신 ${viewYear}년의 반 구조(반 이름/연령/담당교사)로 ${year}년 반별명단을 덮어쓸까요? 아이들은 전부 별명부로 모이고, 기존 ${year}년 자료는 사라집니다.\n\n⚠ 이 작업은 되돌릴 수 없습니다.`
    : `${year}년을 새로운 연도로 시작할까요?\n\n지금 보고 계신 ${viewYear}년의 반 구조(반 이름/연령/담당교사)와 선생님 명단은 그대로 가져오고, 아이들은 전부 별명부로 옮겨집니다. 이후 별명부에서 🔀 버튼으로 각 아이를 새 반에 배정해주세요.`;
  if (!confirm(msg)) return;

  const newState = buildNewYearRosterFromPrevious(state);
  try {
    await saveYearData(year, newState, true);
  } catch (e) {
    console.error(e);
    alert("새 연도를 시작하지 못했습니다. 인터넷 연결을 확인하고 다시 시도해주세요.");
    return;
  }
  viewYear = year;
  state = await loadState(year);
  attState = await loadAttendance(year);
  render();
  toast(`${year}년을 새로운 연도로 시작했습니다. 별명부에서 아이들을 반으로 옮겨주세요!`);
}

function buildInitialState(seed) {
  let uid = 1;
  const nextId = () => "m" + (uid++);
  const classes = [];

  seed.ageGroups.forEach(group => {
    group.classes.forEach(c => {
      classes.push({
        id: "c" + classes.length, kind: "regular", age: group.age, pastor: group.pastor || "",
        name: c.name, teachers: c.teachers || [],
        members: c.members.map(mm => ({ id: nextId(), ...mm }))
      });
    });
  });
  classes.push({ id: "c_new", kind: "new", age: "", pastor: "", name: seed.newClass.name, teachers: [],
    members: seed.newClass.members.map(mm => ({ id: nextId(), ...mm })) });
  classes.push({ id: "c_alt", kind: "alt", age: "", pastor: "", name: seed.altList.name, teachers: [],
    members: seed.altList.members.map(mm => ({ id: nextId(), ...mm })) });

  const teachers = (seed.teachers || []).map((t, i) => ({
    id: "t" + (i + 1), name: t.name, dob: t.dob || "", calType: t.calType || "solar",
    gender: t.gender || "", phone: t.phone || "", note: t.note || ""
  }));
  return {
    title: seed.title, updated: seed.updated, footnote: seed.footnote, summary: seed.summary,
    ageOrder: seed.ageGroups.map(g => ({ age: g.age, pastor: g.pastor, label: g.label })),
    classes, teachers, teacherUidCounter: teachers.length + 1, uidCounter: uid
  };
}

function migrateState(s) {
  if (!s.teachers) {
    s.teachers = (SEED_DATA.teachers || []).map((t, i) => ({
      id: "t" + (i + 1), name: t.name, dob: t.dob || "", calType: t.calType || "solar",
      gender: t.gender || "", phone: t.phone || "", note: t.note || "",
      dobYearUnknown: !!(t.dob && t.dob.split(".")[0].trim() === "00")
    }));
  } else {
    s.teachers.forEach(t => {
      if (t.dob === undefined) t.dob = "";
      if (t.calType === undefined) t.calType = "solar";
      if (t.gender === undefined) t.gender = "";
      if (t.phone === undefined) t.phone = "";
      if (t.note === undefined) t.note = "";
      // [버그 수정] 예전에는 생년월일 두 자리 연도가 "00"이면 무조건 "연도 미상"으로
      // 취급했는데, 이러면 실제 2000년생 선생님도 전부 "연도 미상"으로 오인됩니다.
      // 이제는 dobYearUnknown이라는 별도 필드로 "진짜 연도 모름"을 저장하므로, 이 필드가
      // 아직 없는 기존 자료에 한해서만 예전 방식(연도가 "00"이면 미상)으로 한 번 채워줍니다.
      // 이후로 수정 화면에서 실제 연도(2000년 등)로 바로잡아 저장하면 정상적으로 구분됩니다.
      if (t.dobYearUnknown === undefined) {
        t.dobYearUnknown = !!(t.dob && t.dob.split(".")[0].trim() === "00");
      }
    });
  }
  if (!s.teacherUidCounter) s.teacherUidCounter = s.teachers.length + 1;
  return s;
}

/* ===== 유틸 ===== */

function findClass(classId) { return state.classes.find(c => c.id === classId); }
function findMemberLocation(memberId) {
  for (const c of state.classes) { const idx = c.members.findIndex(m => m.id === memberId); if (idx !== -1) return { cls: c, idx }; }
  return null;
}
function genMemberId() { return "m" + (state.uidCounter++); }
function genTeacherId() { return "t" + (state.teacherUidCounter++); }
function genClassId() { return "c" + Date.now(); }

/* ===== 생년월일 달력 입력 변환 =====
   저장 형식은 원래대로 "YY.MM.DD"(2자리 연도)를 유지하고, <input type="date"> 달력
   위젯과 서로 변환하는 도우미만 추가합니다.
   [버그 수정] 예전에는 두 자리 연도가 "00"이면 무조건 "연도 모름"이라고 보고 1900년으로
   바꿔서 보여줬는데, 이러면 실제 2000년생(두 자리로 "00")도 전부 1900년으로 잘못
   표시되고 "연도 미상"으로 오인됐습니다. "00"도 다른 두 자리 연도와 똑같이 아래 피벗
   규칙으로 2000년으로 정상 해석하고, "진짜 연도 모름" 여부는 선생님 데이터의 별도 필드
   (dobYearUnknown)로만 관리합니다. */
function dotDobToIso(dob) {
  if (!dob) return "";
  const parts = dob.split(".");
  if (parts.length < 3) return "";
  const yy = parts[0].trim(), mo = parts[1].trim().padStart(2, "0"), dd = parts[2].trim().padStart(2, "0");
  if (!/^\d{1,2}$/.test(mo) || !/^\d{1,2}$/.test(dd)) return "";
  const yyNum = parseInt(yy, 10);
  if (isNaN(yyNum)) return "";
  const pivot = new Date().getFullYear() % 100;
  const year = yyNum <= pivot ? 2000 + yyNum : 1900 + yyNum;
  return `${year}-${mo}-${dd}`;
}

function isoDobToDot(iso, unknownYear) {
  if (!iso) return "";
  const [y, mo, dd] = iso.split("-");
  if (!y || !mo || !dd) return "";
  const yy = unknownYear ? "00" : y.slice(2);
  return `${yy}.${mo}.${dd}`;
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg; el.classList.add("show");
  clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove("show"), 2200);
}

function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[s]));
}

function totalRegular() { return state.classes.filter(c => c.kind === "regular").reduce((s, c) => s + c.members.length, 0); }
