# Design for X — 연세대학교 통합디자인학과 졸업전시

현재 최종 디자인을 정리한 정적 사이트입니다. index.html 한 페이지 안에서 온보딩, 연도별 포스터, VIEW ALL, MORE, about X, about System, 외부 링크 패널을 전환합니다.

X 자동 회전 및 드래그, 포스터 호버 제목 및 전시 사이트 연결, 전체 포스터 보기, 1분 미사용 시 온보딩 복귀를 포함합니다. about System은 제목만 있으며 본문은 추후 추가합니다.

## 실행

```sh
python3 -m http.server 8771 --bind 127.0.0.1
```

http://127.0.0.1:8771/ 에서 확인하세요. 빌드 과정은 없습니다.

Avenir Next는 로컬 설치 폰트 지정이며 없으면 Avenir 또는 sans-serif로 표시됩니다. Pretendard는 CDN을 사용합니다. 이미지와 로고의 권리는 각 권리자에게 있습니다.
